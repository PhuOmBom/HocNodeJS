var studentModule = require("./student");

var student1 = {
    name: "Nguyen Van An",
    scores: [8, 9, 7.5]
};

var student2 = {
    name: "Tran Thi Binh",
    scores: [6, 7, 6.5]
};

var student3 = {
    name: "Le Minh Cuong",
    scores: [4, 5, 4.5]
};

studentModule.printReport(student1);
studentModule.printReport(student2);
studentModule.printReport(student3);
