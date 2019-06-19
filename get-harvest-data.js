const fetch = require("fetch");

const harvest_accessToken =
    "1628880.pt.wQxRuz6IHw4OxHpOU4gW9eZtZ3RaVU0E4WOIRkklwLOb5KqGJcRnrgxgpmjCfoORebFrp7d4jSWkL0k3RmojUw";
const harvest_accountId = "949062";
const harvest_userAgent = "get-harvest-data (kevin.cocquyt@natcheurope.com)";

const azureDevOps_organizationName = "natch";
const azureDevOps_projectName = "natch";
const azureDevOps_username = "kevin_cocquyt@outlook.com";
const azureDevOps_pat = "wgubsfqcbov466fk3pn626qcy7revjghsk7iqdh2mejql2bkmg6q";
const azureDevOps_token = Buffer.from(`${azureDevOps_username}:${azureDevOps_pat}`).toString("base64");

let taskList = [];

const harvest_fetchOptions = {
    headers: {
        Accept: "application/json",
        Authorization: `Bearer ${harvest_accessToken}`,
        "Harvest-Account-Id": harvest_accountId,
        "User-Agent": harvest_userAgent
    }
};

const harvest_fetchUpdateOptions = {
    method: "PUT",
    "Content-Type": "application/json",
    headers: {
        Accept: "application/json",
        Authorization: `Bearer ${harvest_accessToken}`,
        "Harvest-Account-Id": harvest_accountId,
        "User-Agent": harvest_userAgent
    }
};

const azureDevOps_fetchOptions = {
    headers: {
        Accept: "application/json",
        Authorization: `Basic ${azureDevOps_token}`
    }
};

function getTaskId(taskName) {
    var regex = new RegExp(/.*\|.*\|(?<taskId>\d+)/g);
    var matches = regex.exec(taskName);

    if (matches) {
        return matches[1];
    }

    return null;
}

function archiveTask(taskId) {
    const body = { is_active: false };

    const fetchUpdateOptions = Object.assign(
        {
            body: JSON.stringify(body)
        },
        harvest_fetchUpdateOptions
    );

    fetch(`https://api.harvestapp.com/v2/tasks/${taskId}`, fetchUpdateOptions)
        .then(response => response.json())
        .then(data => console.log("archive result", data))
        .catch(error => console.error(error));
}

function tasksFetcher(error, meta, body) {
    const result = JSON.parse(body.toString());
    // console.log("tasks", result);

    if (result.next_page > result.page) {
        fetch.fetchUrl(
            `https://api.harvestapp.com/v2/tasks?is_active=true&page=${result.next_page}`,
            harvest_fetchOptions,
            tasksFetcher
        );
    }

    taskList = [taskList, ...result.tasks];

    for (task of taskList) {
        const taskId = getTaskId(task.name);

        if (taskId) {
            fetch.fetchUrl(
                `https://dev.azure.com/${azureDevOps_organizationName}/${azureDevOps_projectName}/_apis/wit/workitems/${taskId}?api-version=5.0`,
                azureDevOps_fetchOptions,
                workItemFetcher
            );
        }
    }
}

function workItemFetcher(error, meta, body) {
    const result = JSON.parse(body.toString());

    if (typeof result.fields !== "undefined") {
        const workItemId = "" + result.id; // make sure this is a string for the find method
        const workItemState = result.fields["System.State"];

        console.log("workitem:", `ID ${workItemId} - STATE ${workItemState}`);

        if (workItemState === "Closed") {
            const task = taskList.find(task => getTaskId(task.name) === workItemId);

            if (task) {
                console.log("task:", `ID ${task.id} - NAME ${task.name} - ACTIVE ${task.is_active} => ARCHIVE`);

                // archiveTask(task.id);
            }
        }
    }
}

fetch.fetchUrl(`https://api.harvestapp.com/v2/tasks?is_active=true`, harvest_fetchOptions, tasksFetcher);
