const querystring = require("querystring");

const text = "name=Lan&course=NodeJS&score=9";

const result = querystring.parse(text);

console.log("Name:", result.name);
console.log("Course:", result.course);
console.log("Score:", result.score);

const student = {
  name: result.name,
  course: result.course,
  score: result.score
};

const newQuery = querystring.stringify(student);

console.log("Object moi:", student);
console.log("Query string moi:", newQuery);
