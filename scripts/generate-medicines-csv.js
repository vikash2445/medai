import fs from "fs";

const baseproducts = [
  { name: "Paracetamol", category: "fever", tags: ["fever", "pain", "headache"] },
  { name: "Ibuprofen", category: "pain", tags: ["pain", "inflammation"] },
  { name: "Cetirizine", category: "allergy", tags: ["allergy", "sneezing"] },
  { name: "Omeprazole", category: "acidity", tags: ["acidity", "gas", "heartburn"] },
  { name: "ORS", category: "hydration", tags: ["dehydration", "diarrhea"] },
  { name: "Amoxicillin", category: "infection", tags: ["infection"], is_antibiotic: true },
  { name: "Azithromycin", category: "infection", tags: ["infection"], is_antibiotic: true },
];

const types = ["tablet", "capsule", "syrup"];
const strengths = [250, 500, 650];

let csv = "id,name,generic,category,type,price,is_antibiotic,tags,image\n";

for (let i = 0; i < 500; i++) {
  const base = baseproducts[i % baseproducts.length];
  const strength = strengths[i % strengths.length];

  const id = i + 1;
  const name = `${base.name} ${strength}mg`;
  const generic = base.name.toLowerCase();
  const category = base.category;
  const type = types[i % types.length];
  const price = Math.floor(Math.random() * 100) + 20;
  const is_antibiotic = base.is_antibiotic ? "true" : "false";

  // PostgreSQL array format
  const tags = `"{${base.tags.join(",")}}"`;

  const image = `/products/${generic}.jpg`;

  csv += `${id},${name},${generic},${category},${type},${price},${is_antibiotic},${tags},${image}\n`;
}

fs.writeFileSync("products_500.csv", csv);

console.log("✅ 500 products CSV generated!");