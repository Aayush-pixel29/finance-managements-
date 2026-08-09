const projectId = "family-expenseapp";
const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/expenses`;

fetch(url)
  .then(res => res.json())
  .then(data => {
    if (!data.documents) {
      console.log("No expenses found in the database.");
      return;
    }
    
    console.log(`Found ${data.documents.length} expenses:`);
    data.documents.forEach(doc => {
      const fields = doc.fields;
      console.log("-----------------------");
      console.log(`ID: ${doc.name.split('/').pop()}`);
      console.log(`Description: ${fields.description?.stringValue}`);
      console.log(`Amount: $${fields.amount?.doubleValue || fields.amount?.integerValue}`);
      console.log(`Section: ${fields.section?.stringValue}`);
      console.log(`Type: ${fields.type?.stringValue}`);
      console.log(`Paid By: ${fields.paidBy?.stringValue}`);
    });
  })
  .catch(err => console.error("Error fetching data:", err));
