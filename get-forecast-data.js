// https://www.npmjs.com/package/forecast-promise
// https://id.getharvest.com/developers

// HARVEST

const Forecast = require("forecast-promise");

const forecast = new Forecast({
    accountId: "949057",
    token: "1635118.pt.-fQ40TzCV6Sqc6w3LKtTplTgKu4cFDDNS-O5-96ISLd9uid5ETR3n1TC-wpkNVJakGvkFYUxtgUppH3NoH2agg"
});

// forecast
//     .whoAmI()
//     .then(user => console.log(user))
//     .catch(error => console.error(error));

// forecast
//     .projects()
//     .then(projects => {
//         for (let project of projects) {
//             // console.log(project);
//             if (project.notes && project.notes.indexOf("taken") !== -1) {
//                 console.log("project: " + project.id + ", notes: " + project.notes);
//             }
//         }
//     })
//     .catch(error => console.error(error));

forecast
    .assignments()
    .then(assignments => {
        console.log(assignments);
    })
    .catch(error => console.error(error));
