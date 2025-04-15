const admin = require("firebase-admin");

// Load Firebase service account key
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Function to upload lessons
const uploadLesson = async () => {
  const lessonData = [
    ``,
    ``,
    ``,
    ``,
    ``,
    
  ];
  const courseId = "basic_anatomy";
  const lessonId = "1";
  const lessonRef = db.collection("courses").doc(courseId).collection("lessons").doc(lessonId);
  const newParagraph = `**Introduction**

Maintaining good hygiene is essential for overall health, preventing infections, and promoting well-being. Proper hygiene practices help remove dirt, bacteria, and other harmful substances from your body and surroundings.

**Daily Body Cleaning**

- **Comprehensive Washing:** Clean all parts of your body daily. For individuals with a penis, gently pull back the foreskin to wash underneath. For those with a clitoris, gently pull back the clitoral hood and wash with warm water and mild, unscented soap. Avoid using scented products as they can irritate sensitive skin.
- **Vulva Care:** Use your hands and mild soap to gently wash the delicate skin around the vulva. Do not clean inside the vagina or use douches, as this can disrupt the natural balance of healthy bacteria.
`

  await lessonRef.set(
    {
      paragraphs: admin.firestore.FieldValue.arrayUnion(newParagraph),
    },
    { merge: true } // Ensures existing data isn't overwritten
  );
  

};

// Run the function
uploadLesson()
  .then(() => process.exit(0)) // Exit after successful upload
  .catch((error) => {
    console.error("Error uploading lesson:", error);
    process.exit(1);
  });
