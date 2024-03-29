/* カスタマイズするには、この部分を変更してください。 */
const searchDelay = 500; // 入力を始めてから検索が開始されるまでの待ち時間（ミリ秒）
const input = "https://adachi-a.github.io/noodles/data.tsv"; // 検索用のデータの場所
const item_id_col_name = "item_id"
const item_title_col_name = "店名";
const item_url_col_name = "item_url";
const item_iiif_manifest_url_col_name = "item_iiif_manifest_url"
const item_hidden_columns = [item_id_col_name, item_title_col_name, item_url_col_name, item_iiif_manifest_url_col_name];
const options = {
item: function (data) {

const item_title = data[item_title_col_name];
const item_url = data[item_url_col_name];
let list_item_html = ""
Object.keys(data).forEach(key => {
if (!item_hidden_columns.includes(key)) {
if (data[key].startsWith("http")) {
list_item_html += `${key}: <a href="${data[key]}" target="_blank">${data[key]}</a> / `
} else {
list_item_html += `<span>${key}: ${data[key]}</span> / `
}
}
});
list_item_html = list_item_html.slice(0, -3);
return `
<li>
    <dl>
        <dt class="Title"><a href="${item_url}" target="_blank"><span>${item_title}</span></a></dt>
        <dd class="Description"><small>${list_item_html}</small></dd>
    </dl>
</li>
`;
},
page: 20,
pagination: {
innerWindow: 2,
outerWindow: 1,
item: '<li class="page-item"><a class="page page-link" href="#"></a></li>',
}
};
/* ここから下は、基本的に変更する必要はありません。 */

const itemCounter = document.getElementById("itemCounter");
const searchBox = document.getElementById("searchBox");
const searchButton = document.getElementById("searchButton");
const loadingSpinner = document.getElementById("loadingSpinner");

let daList = {};
let catalog = {};

const tsvLoad = async (input) => {
const savedTsv = sessionStorage.getItem("tsv");
const response = await fetch(input);
if (response.ok) {
const textValue = await response.text();
sessionStorage.setItem("tsv", textValue);
return textValue;
} else {
return Promise.reject(new Error(`Failed. Status Code: ${response.status}`));
}
};

const tsvToArray = (str) => {
const headers = str.split('\n')[0].split('\t');
const rows = str.slice(str.indexOf("\n") + 1)
.split(/\n|\r\n|\r/);
const arr = rows.map(function (row) {
const values = row.split("\t");
const el = headers.reduce(
function (obj, header, i) {
//const v = values[i].replaceAll('\"', '');
const v = values[i];
obj[header] = v;
return obj;
}, {}
);
return el;
});
return arr;
};

loadingSpinner.classList.remove("d-none");

tsvLoad(input)
.then((text) => {
catalog = tsvToArray(text.trimEnd());
daList = new List('daList', options, catalog);
loadingSpinner.classList.add("d-none");
daList.on("updated", function () {
itemCounter.innerText = String(daList.matchingItems.length) + "件の検索結果";
unmark();
mark();
});
daList.update();
}).catch((error) => {
console.warn(error);
});

const listSearch = (query) => {
loadingSpinner.classList.remove("d-none");
query = query.trimEnd();
if (query !== "") {
daList.search(query.split(/\s+/).join(" "));
}
daList.update();
loadingSpinner.classList.add("d-none");
};

const resetList = () => {
daList.search();
daList.update();
}

const executeSearch = (e) => {
listSearch(searchBox.value);
};

const incrementalSearch = (e) => {
const input = searchBox.value;
const search = () => {
setTimeout(async () => {
const currentInput = searchBox.value;
if (input === currentInput) {
listSearch(input);
}
}, searchDelay);
};
input === "" ? resetList() : search();
};

searchButton.addEventListener('click', {
handleEvent: executeSearch
});

searchBox.addEventListener('input', {
handleEvent: incrementalSearch
});

const mark = () => {
var instance = new Mark(document.querySelectorAll("dl"));
instance.mark(searchBox.value.replace(/[\x00-\x09\x0b-\x1f\x7f-\x9f]/g, '').replace(/\x0a/g, ''));
};

const unmark = () => {
for (const target of document.querySelectorAll("mark")) {
const parentEl = target.parentNode;
while (target.firstChild) {
parentEl.insertBefore(target.firstChild, target);
}
target.remove();
parentEl.normalize();
}
};