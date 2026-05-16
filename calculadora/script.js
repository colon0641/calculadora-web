const operationElement = document.getElementById("operation");
const resultElement = document.getElementById("result");
const angleModeElement = document.getElementById("angleMode");
const keys = document.querySelector(".keys");

let expression = "";
let angleMode = "DEG";

const operators = ["+", "-", "*", "/", "%", "^"];
const functions = ["sin", "cos", "tan", "log", "ln", "sqrt"];

function updateDisplay(result = null) {
  operationElement.textContent = expression ? formatExpression(expression) : "0";
  resultElement.textContent = result ?? "0";
}

function addValue(value) {
  const lastCharacter = expression.slice(-1);

  if (value === ",") {
    value = ".";
  }

  if (value === "." && currentNumber().includes(".")) {
    return;
  }

  if (operators.includes(value) && operators.includes(lastCharacter) && value !== "-") {
    expression = expression.slice(0, -1) + value;
    updateDisplay();
    return;
  }

  if (expression === "" && operators.includes(value) && value !== "-") {
    return;
  }

  if (shouldAddImplicitMultiplication(value)) {
    expression += "*";
  }

  expression += value;
  updateDisplay();
}

function shouldAddImplicitMultiplication(value) {
  if (!expression) {
    return false;
  }

  const previousIsValue = /\d|\)/.test(expression.slice(-1)) || expression.endsWith("pi") || expression.endsWith("e");
  const nextIsGroupedValue = value === "(" || value === "pi" || value === "e" || functions.some((name) => value === `${name}(`);

  return previousIsValue && nextIsGroupedValue;
}

function currentNumber() {
  return expression.split(/[+\-*/%^()]/).pop();
}

function clearCalculator() {
  expression = "";
  updateDisplay();
}

function deleteLastCharacter() {
  expression = expression.slice(0, -1);
  updateDisplay();
}

function toggleSign() {
  if (!expression) {
    expression = "-";
    updateDisplay();
    return;
  }

  const match = expression.match(/(-?\d+\.?\d*)$/);

  if (!match) {
    return;
  }

  const number = match[0];
  const start = expression.length - number.length;
  const changedNumber = number.startsWith("-") ? number.slice(1) : `-${number}`;
  expression = expression.slice(0, start) + changedNumber;
  updateDisplay();
}

function factorial(number) {
  if (!Number.isInteger(number) || number < 0) {
    throw new Error("Factorial invalido");
  }

  if (number > 170) {
    throw new Error("Factorial demasiado grande");
  }

  let total = 1;

  for (let index = 2; index <= number; index += 1) {
    total *= index;
  }

  return total;
}

function toRadians(value) {
  return angleMode === "DEG" ? value * (Math.PI / 180) : value;
}

function sin(value) {
  return Math.sin(toRadians(value));
}

function cos(value) {
  return Math.cos(toRadians(value));
}

function tan(value) {
  return Math.tan(toRadians(value));
}

function replaceFactorials(value) {
  let output = value;
  let factorialIndex = output.indexOf("!");

  while (factorialIndex !== -1) {
    let start = factorialIndex - 1;

    if (output[start] === ")") {
      let depth = 1;
      start -= 1;

      while (start >= 0 && depth > 0) {
        if (output[start] === ")") depth += 1;
        if (output[start] === "(") depth -= 1;
        start -= 1;
      }

      start += 1;
    } else {
      while (start >= 0 && /[\d.]/.test(output[start])) {
        start -= 1;
      }

      start += 1;
    }

    const factorialValue = output.slice(start, factorialIndex);
    output = `${output.slice(0, start)}factorial(${factorialValue})${output.slice(factorialIndex + 1)}`;
    factorialIndex = output.indexOf("!");
  }

  return output;
}

function prepareExpression(value) {
  let prepared = value
    .replaceAll("pi", "Math.PI")
    .replaceAll("e", "Math.E")
    .replaceAll("^", "**");

  functions.forEach((name) => {
    const replacement = {
      sin: "sin",
      cos: "cos",
      tan: "tan",
      log: "Math.log10",
      ln: "Math.log",
      sqrt: "Math.sqrt",
    }[name];

    prepared = prepared.replaceAll(`${name}(`, `${replacement}(`);
  });

  return replaceFactorials(prepared);
}

function formatExpression(value) {
  return value.replaceAll("*", "x");
}

function calculate() {
  if (!expression || operators.includes(expression.slice(-1))) {
    return;
  }

  try {
    const preparedExpression = prepareExpression(expression);
    const result = Function(
      "factorial",
      "sin",
      "cos",
      "tan",
      `"use strict"; return (${preparedExpression})`
    )(factorial, sin, cos, tan);

    if (!Number.isFinite(result)) {
      throw new Error("Resultado no valido");
    }

    const formattedResult = Number.isInteger(result)
      ? result.toString()
      : result.toFixed(8).replace(/\.?0+$/, "");

    resultElement.textContent = formattedResult;
    operationElement.textContent = formatExpression(expression);
    expression = formattedResult;
  } catch (error) {
    resultElement.textContent = "Error";
  }
}

function toggleAngleMode() {
  angleMode = angleMode === "DEG" ? "RAD" : "DEG";
  angleModeElement.textContent = angleMode;
}

keys.addEventListener("click", (event) => {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  const { value, action } = button.dataset;

  if (value) {
    addValue(value);
  }

  if (action === "clear") {
    clearCalculator();
  }

  if (action === "delete") {
    deleteLastCharacter();
  }

  if (action === "toggle-sign") {
    toggleSign();
  }

  if (action === "toggle-angle") {
    toggleAngleMode();
  }

  if (action === "calculate") {
    calculate();
  }
});

document.addEventListener("keydown", (event) => {
  const allowedKeys = "0123456789+-*/%^().,";

  if (allowedKeys.includes(event.key)) {
    addValue(event.key);
  }

  if (event.key === "Enter" || event.key === "=") {
    event.preventDefault();
    calculate();
  }

  if (event.key === "Backspace") {
    deleteLastCharacter();
  }

  if (event.key === "Escape") {
    clearCalculator();
  }
});

updateDisplay();
