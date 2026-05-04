const fetch = require('node-fetch'); // Netlify includes this by default

exports.handler = async function(event, context) {
  const JAKIM_API = "https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=today&zone=SGR01";
  
  try {
    const response = await fetch(JAKIM_API);
    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Allows your frontend to talk to your function
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
        body: JSON.stringify({ 
            error: "Failed fetching JAKIM data", 
            message: error.message,
            stack: error.stack
    })
  };
}}