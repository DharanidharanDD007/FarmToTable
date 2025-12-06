// const Note = require("../model/Login.js");

// // Get all notes
// const getAllNotes = async (req, res) => {
//   try {
//     const notes = await Note.find().sort({ createdAt: -1 });
//     res.status(200).json(notes);
//   } catch (error) {
//     console.log("Error in AllNote controller", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// const getById=async (req,res)=>{
//    try {
//       const note=await Note.findById(req.params.id);
//       if(!note) return res.status(201).json({message:"User id not found!!"});
//       res.json(note);
//    } catch (error) {
//        console.log("Error in Id controller", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// // Create a note
// const createNotes = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     const newNote = new Note({ name, email, password });
//     const savedNote = await newNote.save();

//     res.status(201).json({
//       message: "New User created successfully",
//       note: savedNote,
//     });
//   } catch (error) {
//     console.log("Error occur in create Notes", error);
//     res.status(500).json({ message: "Internal server error!" });
//   }
// };

// // Update a note
// const updateNotes = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     const updatedNote = await Note.findByIdAndUpdate(
//       req.params.id,
//       { name, email, password },
//       { new: true }
//     );

//     if (!updatedNote)
//       return res.status(404).json({ message: "User not found" });

//     res.status(200).json({
//       message: "User updated successfully!",
//       note: updatedNote,
//     });
//   } catch (error) {
//     console.log("Error occur in Updated Notes", error);
//     res.status(500).json({ message: "Internal server error!" });
//   }
// };



//  const deleteNotes=async(req, res)=> {
//    try{
//   const deleteNote=await Note.findByIdAndDelete(req.params.id);
//    if(!deleteNote) return res.status(404).json({
//       message:"User not found"
//    });

//    res.status(200).json({message:"User deleted successfully!",
//       note:deleteNote,
//    });
// }catch(error){
//    console.log("Error occur in delete Notes", error);
//     res.status(500).json({ message: "Internal server error!" });
// }
// }

// module.exports={getAllNotes,getById,createNotes,updateNotes,deleteNotes};
