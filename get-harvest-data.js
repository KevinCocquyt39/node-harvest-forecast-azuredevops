const accessToken = "1635118.pt.-fQ40TzCV6Sqc6w3LKtTplTgKu4cFDDNS-O5-96ISLd9uid5ETR3n1TC-wpkNVJakGvkFYUxtgUppH3NoH2agg";
const accountId = "949057";
const userAgent = "get-harvest-data (kevin.cocquyt@natcheurope.com)";

var fetchOptions = {
    headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Harvest-Account-Id": accountId,
        "User-Agent": userAgent
    }
};

function tasksFetcher(error, meta, body) {
    const result = JSON.parse(body.toString());
    console.log("tasks", result);
}

fetch.fetchUrl(`https://api.harvestapp.com/v2/tasks`, fetchOptions, tasksFetcher);
