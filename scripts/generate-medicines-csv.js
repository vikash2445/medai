import fs from "fs";

const baseMedicines = [
  { name: "Paracetamol", category: "fever", tags: ["fever", "pain", "headache"] },
  { name: "Ibuprofen", category: "pain", tags: ["pain", "inflammation"] },
  { name: "Cetirizine", category: "allergy", tags: ["allergy", "sneezing"] },
  { name: "Omeprazole", category: "acidity", tags: ["acidity", "gas", "heartburn"] },
  { name: "ORS", category: "hydration", tags: ["dehydration", "diarrhea"] },
  { name: "Amoxicillin", category: "infection", tags: ["infection"], isAntibiotic: true },
  { name: "Azithromycin", category: "infection", tags: ["infection"], isAntibiotic: true },
];

const types = ["tablet", "capsule", "syrup"];
const strengths = [250, 500, 650];

let csv = "id,name,generic,category,type,price,isAntibiotic,tags,image\n";

for (let i = 0; i < 500; i++) {
  const base = baseMedicines[i % baseMedicines.length];
  const strength = strengths[i % strengths.length];

  const id = i + 1;
  const name = `${base.name} ${strength}mg`;
  const generic = base.name.toLowerCase();
  const category = base.category;
  const type = types[i % types.length];
  const price = Math.floor(Math.random() * 100) + 20;
  const isAntibiotic = base.isAntibiotic ? "true" : "false";

  // PostgreSQL array format
  const tags = `"{${base.tags.join(",")}}"`;

  const image = `/medicines/${generic}.jpg`;

  csv += `${id},${name},${generic},${category},${type},${price},${isAntibiotic},${tags},${image}\n`;
}

fs.writeFileSync("medicines_500.csv", csv);

console.log("✅ 500 medicines CSV generated!");