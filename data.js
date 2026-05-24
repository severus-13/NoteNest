const SEMESTERS = {
  1: {
    label: "Semester 1",
    subjects: [
      "Engineering Mathematics I",
      "Engineering Physics",
      "Engineering Chemistry",
      "Programming in C",
      "English Communication",
      "Engineering Graphics",
      "Workshop Practice"
    ]
  },
  2: {
    label: "Semester 2",
    subjects: [
      "Engineering Mathematics II",
      "Data Structures",
      "Digital Logic Design",
      "Object Oriented Programming",
      "Environmental Science",
      "Basic Electrical Engineering",
      "Communication Skills"
    ]
  },
  3: {
    label: "Semester 3",
    subjects: [
      "Discrete Mathematics",
      "Computer Organization",
      "Database Management Systems",
      "Operating Systems",
      "Design & Analysis of Algorithms",
      "Probability & Statistics",
      "Technical Writing"
    ]
  },
  4: {
    label: "Semester 4",
    subjects: [
      "Theory of Computation",
      "Computer Networks",
      "Software Engineering",
      "Microprocessors",
      "Web Technologies",
      "Numerical Methods",
      "Professional Ethics"
    ]
  },
  5: {
    label: "Semester 5",
    subjects: [
      "Compiler Design",
      "Machine Learning",
      "Information Security",
      "Mobile Application Development",
      "Cloud Computing",
      "Elective I",
      "Mini Project"
    ]
  },
  6: {
    label: "Semester 6",
    subjects: [
      "Artificial Intelligence",
      "Distributed Systems",
      "Data Mining",
      "Internet of Things",
      "Elective II",
      "Elective III",
      "Industrial Training Report"
    ]
  },
  7: {
    label: "Semester 7",
    subjects: [
      "Big Data Analytics",
      "Blockchain Technology",
      "Natural Language Processing",
      "Elective IV",
      "Elective V",
      "Seminar",
      "Major Project Phase I"
    ]
  },
  8: {
    label: "Semester 8",
    subjects: [
      "Cyber Security",
      "Deep Learning",
      "Elective VI",
      "Elective VII",
      "Major Project Phase II",
      "Comprehensive Viva",
      "Internship Report"
    ]
  }
};

const TIMETABLES = {
  1: [
    { day: "Monday", slots: [{ time: "9:00–10:00", subject: "Engineering Mathematics I" }, { time: "10:00–11:00", subject: "Engineering Physics" }, { time: "2:00–4:00", subject: "Workshop Practice" }] },
    { day: "Tuesday", slots: [{ time: "9:00–10:00", subject: "Programming in C" }, { time: "10:00–11:00", subject: "Engineering Chemistry" }] },
    { day: "Wednesday", slots: [{ time: "9:00–10:00", subject: "Engineering Graphics" }, { time: "11:00–12:00", subject: "English Communication" }] },
    { day: "Thursday", slots: [{ time: "9:00–10:00", subject: "Engineering Physics" }, { time: "10:00–11:00", subject: "Engineering Mathematics I" }] },
    { day: "Friday", slots: [{ time: "9:00–10:00", subject: "Programming in C (Lab)" }, { time: "2:00–3:00", subject: "Engineering Chemistry" }] }
  ],
  2: [
    { day: "Monday", slots: [{ time: "9:00–10:00", subject: "Data Structures" }, { time: "10:00–11:00", subject: "Engineering Mathematics II" }] },
    { day: "Tuesday", slots: [{ time: "9:00–10:00", subject: "Object Oriented Programming" }, { time: "2:00–4:00", subject: "Digital Logic Design (Lab)" }] },
    { day: "Wednesday", slots: [{ time: "9:00–10:00", subject: "Basic Electrical Engineering" }, { time: "11:00–12:00", subject: "Communication Skills" }] },
    { day: "Thursday", slots: [{ time: "9:00–10:00", subject: "Environmental Science" }, { time: "10:00–11:00", subject: "Data Structures (Lab)" }] },
    { day: "Friday", slots: [{ time: "9:00–10:00", subject: "Engineering Mathematics II" }, { time: "10:00–11:00", subject: "Object Oriented Programming" }] }
  ],
  3: [
    { day: "Monday", slots: [{ time: "9:00–10:00", subject: "Database Management Systems" }, { time: "10:00–11:00", subject: "Discrete Mathematics" }] },
    { day: "Tuesday", slots: [{ time: "9:00–10:00", subject: "Operating Systems" }, { time: "2:00–4:00", subject: "Computer Organization (Lab)" }] },
    { day: "Wednesday", slots: [{ time: "9:00–10:00", subject: "Design & Analysis of Algorithms" }, { time: "11:00–12:00", subject: "Probability & Statistics" }] },
    { day: "Thursday", slots: [{ time: "9:00–10:00", subject: "Discrete Mathematics" }, { time: "10:00–11:00", subject: "Technical Writing" }] },
    { day: "Friday", slots: [{ time: "9:00–10:00", subject: "Operating Systems (Lab)" }, { time: "10:00–11:00", subject: "Database Management Systems" }] }
  ],
  4: [
    { day: "Monday", slots: [{ time: "9:00–10:00", subject: "Computer Networks" }, { time: "10:00–11:00", subject: "Theory of Computation" }] },
    { day: "Tuesday", slots: [{ time: "9:00–10:00", subject: "Software Engineering" }, { time: "2:00–4:00", subject: "Microprocessors (Lab)" }] },
    { day: "Wednesday", slots: [{ time: "9:00–10:00", subject: "Web Technologies" }, { time: "11:00–12:00", subject: "Numerical Methods" }] },
    { day: "Thursday", slots: [{ time: "9:00–10:00", subject: "Professional Ethics" }, { time: "10:00–11:00", subject: "Computer Networks (Lab)" }] },
    { day: "Friday", slots: [{ time: "9:00–10:00", subject: "Software Engineering" }, { time: "10:00–11:00", subject: "Web Technologies (Lab)" }] }
  ],
  5: [
    { day: "Monday", slots: [{ time: "9:00–10:00", subject: "Machine Learning" }, { time: "10:00–11:00", subject: "Compiler Design" }] },
    { day: "Tuesday", slots: [{ time: "9:00–10:00", subject: "Cloud Computing" }, { time: "2:00–3:00", subject: "Elective I" }] },
    { day: "Wednesday", slots: [{ time: "9:00–10:00", subject: "Information Security" }, { time: "11:00–12:00", subject: "Mobile Application Development" }] },
    { day: "Thursday", slots: [{ time: "9:00–12:00", subject: "Mini Project" }] },
    { day: "Friday", slots: [{ time: "9:00–10:00", subject: "Compiler Design (Lab)" }, { time: "10:00–11:00", subject: "Machine Learning (Lab)" }] }
  ],
  6: [
    { day: "Monday", slots: [{ time: "9:00–10:00", subject: "Artificial Intelligence" }, { time: "10:00–11:00", subject: "Distributed Systems" }] },
    { day: "Tuesday", slots: [{ time: "9:00–10:00", subject: "Data Mining" }, { time: "10:00–11:00", subject: "Internet of Things" }] },
    { day: "Wednesday", slots: [{ time: "9:00–10:00", subject: "Elective II" }, { time: "11:00–12:00", subject: "Elective III" }] },
    { day: "Thursday", slots: [{ time: "9:00–11:00", subject: "Industrial Training Report" }] },
    { day: "Friday", slots: [{ time: "9:00–10:00", subject: "Artificial Intelligence (Lab)" }, { time: "2:00–4:00", subject: "Distributed Systems (Lab)" }] }
  ],
  7: [
    { day: "Monday", slots: [{ time: "9:00–10:00", subject: "Big Data Analytics" }, { time: "10:00–11:00", subject: "Blockchain Technology" }] },
    { day: "Tuesday", slots: [{ time: "9:00–10:00", subject: "Natural Language Processing" }, { time: "10:00–11:00", subject: "Elective IV" }] },
    { day: "Wednesday", slots: [{ time: "9:00–12:00", subject: "Major Project Phase I" }] },
    { day: "Thursday", slots: [{ time: "9:00–10:00", subject: "Elective V" }, { time: "11:00–12:00", subject: "Seminar" }] },
    { day: "Friday", slots: [{ time: "9:00–11:00", subject: "Major Project Phase I (Lab)" }] }
  ],
  8: [
    { day: "Monday", slots: [{ time: "9:00–10:00", subject: "Cyber Security" }, { time: "10:00–11:00", subject: "Deep Learning" }] },
    { day: "Tuesday", slots: [{ time: "9:00–10:00", subject: "Elective VI" }, { time: "10:00–11:00", subject: "Elective VII" }] },
    { day: "Wednesday", slots: [{ time: "9:00–12:00", subject: "Major Project Phase II" }] },
    { day: "Thursday", slots: [{ time: "9:00–11:00", subject: "Comprehensive Viva" }] },
    { day: "Friday", slots: [{ time: "9:00–10:00", subject: "Internship Report" }, { time: "2:00–4:00", subject: "Major Project Phase II" }] }
  ]
};
