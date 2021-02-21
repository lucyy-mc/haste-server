/*
Copyright © Lucy Poulton 2021. This code is licensed under the MIT license.

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the ‘Software’), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED ‘AS IS’, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

let isNavigatingAway = false;

function setLanguage(lang) {
    for (let obj of Prism.Live.allInstances) {
        obj.setLanguage(lang);
    }
    document.getElementById("language").innerText = lang;
    window.location.hash = '#' + lang;
    endSearch();
}

function update() {
    for (let obj of Prism.Live.allInstances) {
        obj.update(true);
    }
}

function search() {
    let input = document.getElementById("dropdown-search").value;
    let languages = Object.keys(Prism.languages);
    let outElement = document.getElementById("dropdown-inner");

    outElement.querySelectorAll("div").forEach(x => x.remove());
    if (input === "") {
        for (let lang of ["java", "yaml", "html", "css", "javascript", "json", "python", "csharp"]) {
            outElement.innerHTML += `<div onclick="setLanguage('${lang}')">${lang}</div>`
        }
        outElement.innerHTML += `<div>[search for more]</div>`
        return;
    }
    for (let lang of languages) {
        if (lang.includes(input)) outElement.innerHTML += `<div onclick="setLanguage('${lang}')">${lang}</div>`
    }
}

function endSearch() {
    document.getElementById("dropdown-content").classList.add("hidden");
}

function startSearch() {
    document.getElementById("dropdown-content").classList.remove("hidden");
    let searchBox = document.getElementById("dropdown-search");
    searchBox.focus();
    searchBox.value = "";
    search();

}

function updateHash() {
    if (window.location.hash !== "") setLanguage(window.location.hash.substring(1));
}

function isEditMode() {
    return document.getElementById("button-copy").classList.contains("disabled");
}

function setEditMode() {
    document.getElementById("button-copy").classList.add("disabled");
    document.getElementById("button-link").classList.add("disabled");
    document.getElementById("button-save").classList.remove("disabled");
    document.querySelector("textarea").readOnly = false;
}

function setReadMode() {
    document.getElementById("button-copy").classList.remove("disabled");
    document.getElementById("button-link").classList.remove("disabled");
    document.getElementById("button-save").classList.add("disabled");
    document.querySelector("textarea").readOnly = true;
}

function retrieveDocument(docId) {
    let split = window.location.pathname.split("/");
    if (docId === undefined) {
        docId = split[split.length - 1];
    }

    if (docId === "") {
        setEditMode();
        return;
    }

    fetch("/documents/" + docId)
        .then(data => data.json())
        .then(data => {
            if (!!data["data"]) {
                document.querySelector("textarea").value = data["data"];
                setReadMode();
                update();
                if (split[split.length - 2] === "copy") {
                    setEditMode();
                }
            } else {
                window.location = "/";
                isNavigatingAway = true;
            }
        }).catch(e => alert("An error has occurred. Please report this (details on https://lucyy.me)!"));
}

function newDocument() {
    if (isEditMode()) {
        if (confirm("This will reset your current document. Are you sure?"))
            document.querySelector("textarea").value = "";
        update();
        return;
    }
    window.location = "/";
}

function putDocument() {
    if (!isEditMode()) return;
    fetch("/documents", {
        method: 'POST',
        body: document.querySelector("textarea").value
    }).then(data => data.json())
        .then(data => {
            isNavigatingAway = true;
            window.location = `/${data['key']}${window.location.hash}`;
        }).catch(error => alert("An error has occurred. Please report this (details on https://lucyy.me)!"));
}

function copyDocument() {
    if (isEditMode()) return;
    let splitName = window.location.pathname.split("/");
    splitName[0] = "copy"
    isNavigatingAway = true;
    window.location = `/${splitName.join("/")}${window.location.hash}`
}

function copyLink() {
    if (isEditMode()) return;
    navigator.clipboard.writeText(window.location).then(() => {
    }, () => {
    })
    document.getElementById("copy-link-indicator").classList.remove("hidden");
    setTimeout(() => document.getElementById("copy-link-indicator").classList.add("hidden"), 1000);
}

function infoPage() {
    window.location = `/about#md`;
}

window.onhashchange = updateHash;
window.onload = ev => {
    retrieveDocument();
    updateHash();
    document.querySelector('textarea').addEventListener('keydown', function (event) {
        if (event.keyCode === 9) {
            let selectionStartPos = this.selectionStart;
            let selectionEndPos = this.selectionEnd;
            let oldContent = this.value;
            this.value = oldContent.substring(0, selectionStartPos) + "\t" + oldContent.substring(selectionEndPos);
            this.selectionStart = this.selectionEnd = selectionStartPos + 1;
            event.preventDefault();
        }
    });
};
window.onbeforeunload = function (e) {
    if (isEditMode() && !isNavigatingAway) {
        if (document.querySelector("textarea").value.trim() !== "") {
            let msg = "You have unsaved changes! Are you sure?"
            e = e || window.event;
            // For IE and Firefox prior to version 4
            if (e) {
                e.returnValue = msg;
            }

            // For Safari
            return msg;
        }
    }
}

// keybinds
document.onkeydown = function (e) {
    if (e.code === "Escape") {
        endSearch();
    }
    if (e.code === "KeyN" && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        newDocument();
    } else if (e.code === "KeyD" && e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        copyDocument();
    } else if (e.code === "KeyS" && e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        putDocument();
    } else if (e.code === "KeyC" && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        copyLink();
    }
};
