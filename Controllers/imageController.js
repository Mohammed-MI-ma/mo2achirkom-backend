//___MODELS
const {
  getAllowedFieldsForRoleAndPartenaire,
} = require("../../dataFunctions/dataFunctions");
const AnomalieAALBien = require("../../models/AnomalieBien/AnomalieAALBien");
const AnomalieAALCin = require("../../models/AnomalieCIN/AnomalieAALCin");
const Benificaire = require("../../models/Benificaire");

// Function to create a new Benificaire
exports.createImage = async (req, res) => {
  try {
    const newBenificaire = new Benificaire(req.body);
    const savedBenificaire = await newBenificaire.save();
    res.status(201).json(savedBenificaire);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Function to get all Benificaires
exports.getAllBenificaires = async (req, res) => {
  try {
    const benificaires = await Benificaire.find();
    res.status(200).json(benificaires);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
// Function to get Benificaires by CIN
exports.getBenificaireByCIN = async (req, res) => {
  try {
    const cin = req.params.cin; // Correctly retrieves the value from the URL

    // Query the database to find Benificaires with the specified CIN
    const benificaires = await Benificaire.find({ cin });

    if (benificaires.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Aucun bénéficiaire trouvé avec la CIN fournie",
        user: {},
      });
    }
    res.status(200).json({
      success: true,
      message: "Bénéficiaire trouvé avec la CIN fournie.",
      user: benificaires[0],
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Internal server error", user: {} });
  }
};
// Function to get Benificaires by CIN
exports.getBenificairesByEntry = async (req, res) => {
  const entry = req.params.entry;

  try {
    let results = [];

    // Fetch data from the three MongoDB collections based on the chosen entry
    if (entry === "beneficiaire") {
      results = await Benificaire.find({});
    } else if (entry === "anomalieCin") {
      results = await AnomalieAALCin.find({});
    } else if (entry === "anomalieBien") {
      results = await AnomalieAALBien.find({});
    } else {
      return res
        .status(400)
        .json({ success: false, body: {}, message: "failed" });
    }

    return res
      .status(200)
      .json({ success: true, body: results, message: "success" });
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Implement other CRUD functions (update and delete) similarly...
// Function to update a Benificaire
exports.updateBenificaire = async (req, res) => {
  const { benificaireId, userId, userRole, userPartenaire } = req.body;

  try {
    const benificaire = await Benificaire.findById(benificaireId);
    if (!benificaire) {
      return res.status(404).json({ error: "Benificaire not found" });
    }

    if (!benificaire.alteredBy[userRole]) {
      // No user from the same role has altered this record
      const allowedFields = getAllowedFieldsForRoleAndPartenaire(
        userPartenaire,
        userRole === "admin"
      );

      // Check if the fields being updated are allowed
      const updateFields = Object.keys(req.body);
      const invalidFields = updateFields.filter(
        (field) => !allowedFields.includes(field)
      );

      if (invalidFields.length > 0) {
        return res.status(403).json({
          error: `Updating fields ${invalidFields.join(
            ", "
          )} is not allowed for your role and partenaire`,
        });
      }

      // Update the allowed fields
      allowedFields.forEach((field) => {
        if (req.body[field]) {
          benificaire[field] = req.body[field];
        }
      });

      // Set the alteredBy field for this role to userId
      benificaire.alteredBy[userRole] = userId;

      const updatedBenificaire = await benificaire.save();
      return res.status(200).json({
        message: "Benificaire altered successfully",
        body: updatedBenificaire,
      });
    } else {
      // A user from the same role has already altered this record
      return res.status(403).json({
        error: "A user from your role has already altered this row",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Controller to delete a Benificaire
exports.deleteBenificaire = async (req, res) => {
  try {
    const benificaire = await Benificaire.findById(req.params.id);
    if (!benificaire) {
      return res.status(404).json({ error: "Benificaire not found" });
    }

    // Implement any additional checks or validations here if needed

    await benificaire.remove();
    res.status(204).json(); // Respond with a 204 No Content status for successful deletion
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};
