const nodeFetch = require("node-fetch");
const fs = require("fs");
const util = require("util");

const harvest_accessToken =
    "1628880.pt.wQxRuz6IHw4OxHpOU4gW9eZtZ3RaVU0E4WOIRkklwLOb5KqGJcRnrgxgpmjCfoORebFrp7d4jSWkL0k3RmojUw";
const harvest_accountId = "949062";
const harvest_userAgent = "get-harvest-data (kevin.cocquyt@natcheurope.com)";

const azureDevOps_organizationName = "natch";
const azureDevOps_projectName = "natch";
const azureDevOps_username = "kevin_cocquyt@outlook.com";
const azureDevOps_pat = "wgubsfqcbov466fk3pn626qcy7revjghsk7iqdh2mejql2bkmg6q";
const azureDevOps_token = Buffer.from(`${azureDevOps_username}:${azureDevOps_pat}`).toString("base64");

const logFile = fs.createWriteStream("log.txt", { flags: "w" });

const excludeProjectList = ["SCHAC"];

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
    headers: {
        "Content-Type": "application/json",
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

/**
 * Gets Harvest Task identifier from its full name, using a regular expression.
 * @param {String} taskName The Harvest Task name.
 */
function getTaskId(taskName) {
    if (!taskName) {
        return "";
    }

    var regex = new RegExp(/.*\|.*\|(?<taskId>\d+)/g);
    var matches = regex.exec(taskName);

    if (matches) {
        return matches[1];
    }

    return null;
}

/**
 * Get Harvest Task project name from its full name, using a substring.
 * @param {String} taskName The Harvest Task name.
 */
function getTaskProjectName(taskName) {
    if (!taskName) {
        return "";
    }

    return taskName.substring(0, 5);
}

/**
 * Archive a Harvest Task.
 * @param {Object} task The Harvest Task.
 */
function archiveTask(task) {
    const projectName = getTaskProjectName(task.name);
    const logValue = `ID ${task.id} - NAME ${task.name} - PROJECT ${projectName} - ACTIVE ${task.is_active}`;

    if (excludeProjectList.includes(projectName)) {
        console.log("Harvest Task:", `${logValue} => SKIPPED`);
        return;
    }

    console.log("Harvest Task:", `${logValue} => ARCHIVING...`);
    // archiveTaskById(task.id, logValue);
}

/**
 * Archive a Harvest Task by the identifier.
 * @param {Number} taskId The Harvest Task identifier.
 * @param {String} logValue The Harvest Task identifier.
 */
function archiveTaskById(taskId, logValue) {
    const body = { is_active: false };

    const fetchUpdateOptions = Object.assign(
        {
            body: JSON.stringify(body)
        },
        harvest_fetchUpdateOptions
    );

    nodeFetch(`https://api.harvestapp.com/v2/tasks/${taskId}`, fetchUpdateOptions)
        .then(response => response.json())
        .then(data => console.log("Harvest Task:", `${logValue} => ARCHIVED (result: ${JSON.stringify(data)})`))
        .catch(error => console.error(error));
}

/**
 * Overriding of console.log so the logging is written to a text-file.
 */
console.log = function() {
    logFile.write(util.format.apply(null, arguments) + "\n");
};

/**
 * Overriding of console.error so the logging is written to a text-file.
 */
console.error = function() {
    logFile.write(util.format.apply(null, arguments) + "\n");
};

/**
 * Handle the fetch of Azure DevOps Work Items.
 * @param {Object} result The results of the fetch.
 * @param {Array} tasks The list of current tasks, used to retrieve 1 specific task to be archived.
 */
function handleWorkItems(result, tasks) {
    if (typeof result.fields !== "undefined") {
        const workItemId = "" + result.id; // make sure this is a string for the find method
        const workItemState = result.fields["System.State"];

        console.log("Azure DevOps Work Item:", `ID ${workItemId} - STATE ${workItemState}...`);

        if (workItemState === "Closed") {
            const task = tasks.find(task => getTaskId(task.name) === workItemId);

            if (task) {
                archiveTask(task);
            }
        }
    }
}

/**
 * Handle the fetch of Harvest Tasks.
 * @param {Object} result The results of the fetch.
 */
function handleTasks(result) {
    for (task of result.tasks) {
        const taskId = getTaskId(task.name);

        if (taskId) {
            nodeFetch(
                `https://dev.azure.com/${azureDevOps_organizationName}/${azureDevOps_projectName}/_apis/wit/workitems/${taskId}?api-version=5.0`,
                azureDevOps_fetchOptions
            )
                .then(response => response.json())
                .then(data => handleWorkItems(data, result.tasks))
                .catch(error => console.error(error));
        }
    }

    if (result.next_page > result.page) {
        nodeFetch(`https://api.harvestapp.com/v2/tasks?is_active=true&page=${result.next_page}`, harvest_fetchOptions)
            .then(response => response.json())
            .then(data => handleTasks(data))
            .catch(error => console.error(error));
    }
}

nodeFetch(`https://api.harvestapp.com/v2/tasks?is_active=true`, harvest_fetchOptions)
    .then(response => response.json())
    .then(data => handleTasks(data))
    .catch(error => console.error(error));
