export async function handler(event, context) {
    const { start, end } = event.queryStringParameters;

    const url = `http://openAPI.seoul.go.kr:8088/너의API키/json/SeoulPublicLibraryInfo/${start}/${end}`;

    try {
        const response = await fetch(url);  // Node18+ 내장 fetch
        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data),
        };

    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message }),
        };
    }
}
