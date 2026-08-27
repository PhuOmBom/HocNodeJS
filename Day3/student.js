function getAverage(scores) {
    var total = 0;

    for (var i = 0; i < scores.length; i++) {
        total = total + scores[i];
    }

    return total / scores.length;
}

function getRank(average) {
    if (average >= 8) {
        return "Gioi";
    } else if (average >= 6.5) {
        return "Kha";
    } else if (average >= 5) {
        return "Trung binh";
    } else {
        return "Yeu";
    }
}

function printReport(student) {
    var average = getAverage(student.scores);
    var rank = getRank(average);

    console.log("Ten hoc vien: " + student.name);
    console.log("Diem: " + student.scores.join(", "));
    console.log("Diem trung binh: " + average.toFixed(2));
    console.log("Xep loai: " + rank);
    console.log("--------------------");
}

module.exports = {
    getAverage: getAverage,
    getRank: getRank,
    printReport: printReport
};
