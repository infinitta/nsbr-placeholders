import rawContinents from "./continents.js";
import rawCountries from "./countries.js";
import rawPlaceholders from "./placeholders.js"
import rawResources from "./resources.js";

const multiplier = 1;
const size = 15;

var selectedPlaceholderId = "";
var selectedPlaceholderIsFocused = false;

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function generateColour() {
  const h = getRandomInt(360);
  const s = getRandomInt(20) + 80;
  const l = getRandomInt(20) + 40;

  return `hsl(${h}deg, ${s}%, ${l}%)`
}

function renderResourcesList(dataList, listElement) {
  if (dataList.length) {
    dataList.forEach((item) => {
      const listItem = document.createElement("li");
      listItem.innerText = item.name;
      listElement.appendChild(listItem);
    })
  } else {
    const emptyListItem = document.createElement("li");
    listElement.appendChild(emptyListItem);
  }
}

function handleMapEnter() {
  const placeholderDots = document.getElementsByTagName("circle");
  for (let i = 0; i < placeholderDots.length; i++) {
    placeholderDots.item(i).style.opacity = 0.25;
  }
}

function handleMapLeave() {
  const placeholderDots = document.getElementsByTagName("circle");
  for (let i = 0; i < placeholderDots.length; i++) {
    placeholderDots.item(i).style.opacity = 1;
  }
  selectedPlaceholderId = "";
}

function handleDotHover(placeholderData) {
  const idText = document.getElementById("placeholder-id");
  const countryList = document.getElementById("country-list");
  const commonResourcesList = document.getElementById("common-resources-list");
  const uncommonResourcesList = document.getElementById("uncommon-resources-list");
  const rareResourcesList = document.getElementById("rare-resources-list");
  const currentPlaceholderDot = document.getElementById(placeholderData.continentalId);
  const { common, uncommon, rare } = placeholderData.placeholderResources;

  if (selectedPlaceholderId) {
    const activePlaceholderDot = document.getElementById(selectedPlaceholderId);
    activePlaceholderDot.style.opacity = 0.25;
  }

  currentPlaceholderDot.style.opacity = 1;
  idText.innerText = placeholderData.continentalId;
  countryList.textContent = "";
  commonResourcesList.textContent = "";
  uncommonResourcesList.textContent = "";
  rareResourcesList.textContent = "";

  placeholderData.placeholderCountries.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.innerText = `${ item.country.name } (${ item.dominance }%)`;
    listItem.style.color = item.country.colour;
    countryList.appendChild(listItem)
  });

  renderResourcesList(common, commonResourcesList);
  renderResourcesList(uncommon, uncommonResourcesList);
  renderResourcesList(rare, rareResourcesList);

  selectedPlaceholderId = placeholderData.continentalId;
}

const continents = rawContinents.map((item) => ({
  ...item,
  placeholders: []
}));

const resources = rawResources.map((item) => item);

const countries = rawCountries.map((item) => ({
  ...item,
  colour: item.colour || generateColour()
}));

function handlePlaceholderResources(items, frequency) {
  const list = items.length ? items.split("\n") : [];
  if (list.length) {
    return list.map((name) => {
      const resource = resources.find((res) => res.name === name);
      if (!resource) throw new Error(`Resource not found: ${ name }`);
      return resource
    })
  }
  return [];
}

function findCountry(name) {
  const country = countries.find((item) => item.name === name);
  if (!country) throw new Error(`Country not found: ${ name }`);
  return country;
}

function handlePlaceholderCountries(list) {
  const names = list.split("\n");

  if (names.length === 1) {
    const name = names[0];
    const country = findCountry(name);

    return [{
      country,
      dominance: 100
    }]
  }

  const placeholderCountries = names.map((info) => {
    const [rawName, rawDominance] = info.split("(");
    const name = rawName.trim();
    const [dominance] = rawDominance.split("%");

    const country = findCountry(name);

    return { country, dominance }
  });

  return placeholderCountries;
}

const placeholders = rawPlaceholders.map(({
  id,
  posX,
  posY,
  countries,
  name,
  high,
  low,
  medium
}) => {
  const placeholderResources = {
    common: handlePlaceholderResources(high, "high"),
    uncommon: handlePlaceholderResources(medium, "medium"),
    rare: handlePlaceholderResources(low, "low")
  };

  const placeholderCountries = handlePlaceholderCountries(countries);

  return {
    continentalId: id,
    posY,
    posX,
    name,
    placeholderResources,
    placeholderCountries
  }
});

const mapCanvas = document.getElementById("map");
mapCanvas.onmouseenter = handleMapEnter;
mapCanvas.onmouseleave = handleMapLeave
mapCanvas.style.cursor = "crosshair";

placeholders.forEach((item) => {
  const { posX, posY, placeholderCountries, continentalId } = item;
  const colour = placeholderCountries.length === 1 ? placeholderCountries[0].country.colour : "white";
  const placeholderDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");

  placeholderDot.setAttributeNS(null, "cx", posX*multiplier);
  placeholderDot.setAttributeNS(null, "cy", posY*multiplier);
  placeholderDot.setAttributeNS(null, "r", size);
  placeholderDot.setAttributeNS(null, "fill", colour);
  placeholderDot.setAttributeNS(null, "id", continentalId)
  placeholderDot.onmouseover = () => handleDotHover(item);

  mapCanvas.appendChild(placeholderDot);
})
handleMapEnter();

const panZoomMap = svgPanZoom('#map', {
  zoomScaleSensitivity: 0.4
});