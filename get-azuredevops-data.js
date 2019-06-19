const fetch = require("fetch");

const organization = "natch";
const username = "kevin_cocquyt@outlook.com";
const pat = "6ulm32aga6ybcdsh7vv2b4l26mqpkbubmgdt337inp5j5txzazwq";
const token = Buffer.from(`${username}:${pat}`).toString("base64");

var fetchOptions = {
    headers: {
        Accept: "application/json",
        Authorization: `Basic ${token}`
    }
};

function getProjectCode(projectDescription) {
    var regex = new RegExp(/\((.*)\)/);
    var matches = regex.exec(projectDescription);

    // console.log("matches", matches);
    if (matches && matches.length > 0) {
        return matches[1];
    }
}

function getWorkItemFieldsValues(workItemFields) {
    return workItemFields.value[0].fields;
}

function workItemFetcher(error, meta, body) {
    const result = JSON.parse(body.toString());
    console.log("workitem", result);
}

function workItemFieldsFetcher(error, meta, body) {
    const result = JSON.parse(body.toString());
    console.log("workitem id", result.value[0].id);
    console.log("workitem fields", getWorkItemFieldsValues(result));
}

function projectsFetcher(error, meta, body) {
    const result = JSON.parse(body.toString());

    for (const project of result.value) {
        const projectName = project.name;
        const projectCode = getProjectCode(project.description);

        console.log("Azure DevOps project name", projectName);
        console.log("Azure DevOps project code", projectCode);

        const workItemId = "17995";
        const workItemIds = ["17995"];

        const workItemFields = [
            "Microsoft.VSTS.Scheduling.OriginalEstimate",
            "Microsoft.VSTS.Scheduling.RemainingWork",
            "Microsoft.VSTS.Scheduling.CompletedWork"
        ];

        // fetch.fetchUrl(
        //     `https://dev.azure.com/${organization}/${project.name}/_apis/wit/workitems/${workItemId}?api-version=5.0`,
        //     fetchOptions,
        //     workItemFetcher
        // );

        const workItemIdString = workItemIds.join(",");
        const workItemFieldsString = workItemFields.join(",");

        var workItemFieldsUrl = `https://dev.azure.com/${organization}/${
            project.name
        }/_apis/wit/workitems?ids=${workItemIdString}&fields=${workItemFieldsString}&expand=fields&api-version=5.0`;

        fetch.fetchUrl(workItemFieldsUrl, fetchOptions, workItemFieldsFetcher);
    }
}

fetch.fetchUrl(`https://dev.azure.com/${organization}/_apis/projects?api-version=5.0`, fetchOptions, projectsFetcher);