const baseUrl = process.argv[2] || "http://localhost:3000";

async function test(path) {
  const url = `${baseUrl}${path}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    console.log("\nURL:", url);
    console.log("HTTP:", response.status);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.log("\nURL:", url);
    console.error(error);
  }
}

await test("/api/cep?cep=01001000");
await test("/api/cnpj?cnpj=19131243000197");