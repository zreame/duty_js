// exports.handler = async (event, context) => {
//     const JAKIM_URL = "https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=today&zone=SGR01";

//     try {
//         const response = await fetch(JAKIM_URL, {
//             headers: {
//                 // This makes the request look like it's coming from a browser
//                 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
//             }
//         });

//         if (!response.ok) {
//             throw new Error(`JAKIM responded with status: ${response.status}`);
//         }

//         const data = await response.json();
//         return {
//             statusCode: 200,
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(data)
//         };
//     } catch (error) {
//         return {
//             statusCode: 500,
//             body: JSON.stringify({ 
//                 error: "Failed fetching JAKIM data", 
//                 message: error.message,
//                 stack: error.stack 
//             })
//         };
//     }
// };
exports.handler = async (event, context) => {
    const JAKIM_URL = "https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=today&zone=SGR01";

    try {
        const response = await fetch(JAKIM_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                // This is the most important part
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            },
            signal: AbortSignal.timeout(5000) // Don't let it hang forever
        });

        if (!response.ok) {
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: `JAKIM returned ${response.status}` })
            };
        }

        const data = await response.json();
        
        return {
            statusCode: 200,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" // Good for debugging
            },
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: "API Handshake Failed", 
                details: error.message 
            })
        };
    }
};