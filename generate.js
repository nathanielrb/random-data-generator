// var helpers = require('./sparql-helpers');
// var generators = require('./random-data-generators.js');
// var subjectList = require('./subjects');

var helpers = require('/app/sparql-helpers');
var generators = require('/app/random-data-generators.js');
var subjectList = require('/app/subjects');

var N_STUDENTS = 10;
var N_TEACHERS = 4;
var N_CLASSES_PER_TEACHER = 2;
var N_STUDENTS_PER_CLASS = 4;

/*
 This class serves as an example of what can be done with this data
 generator.

 The idea is that you can adapt and extent what is here. As everything is
 javascript everything is really modifyable.

 # class definitions
 The first part of this file contains the file definitions of the 2
 types in our world. As you can see quote is 'owned' by the person who made
 the quote. In javascript the object that we will save looks like:
 ```
var person = {
   name: "John Snow",
   email: "john.snow@winterfell.com",
   quotes: [
     {
       content: "I know nothing",
     }
   ]
 }
 ```
 This person (John) and its relations are correctly save to the triple store with
 a UUID so that the generated data can be used in a traditional mu.semte.ch applicaiton.

 # Random generated
 This module features several functions to randomly generate data. This can then
 together with the model be used to fill the triple store with (semi) random data to
 test or demo the application.
 */

/*
 Person class definition
*/
var personClass = "http://xmlns.com/foaf/0.1/Person";
var personBase = "http://mu.semte.ch/users/";
var personProperties = [
    {   key: "name",
        predicate: "http://xmlns.com/foaf/0.1/name",
        type: {
            type: "string",
            options: {}
        }
    },
    {
        key: "email",
        predicate: "http://xmlns.com/foaf/0.1/mbox",
        type: {
            type: "string",
            options: {}
        }
    },
    {
        key: "role", // student, teacher, principle
        predicate: "http://mu.semte.ch/vocabularies/school/role",
        type: {
            type: "string",
            options: {}
        }
    },
];


/*
 Grade class definition
*/
var gradeClass = "http://mu.semte.ch/vocabularies/school/Grade";
var gradeBase = "http://mu.semte.ch/school/grades/";
var gradeProperties = [
    {
        key: "points",
        predicate: "http://mu.semte.ch/vocabularies/school/gradePoints",
        type: {
            type: "number",
            options: {}
        }
    },
    {
        key: "student",
        predicate: "http://mu.semte.ch/vocabularies/school/gradeRecipient",
        type: {
            type: "relation",
            options: {
                relationClass: personClass,
                relationBase: personBase,
                relationProperties: personProperties
            }
        }
    }
]

/* 
Subject class definition
*/
var subjectClass = "http://mu.semte.ch/vocabularies/school/Subject";
var subjectBase = "http://mu.semte.ch/school/subjects/";
var subjectProperties = [
    {
        key: "name",
        predicate: "http://purl.org/dc/terms/title",
        type: {
            type: "string",
            options: {}
        }
    }
]

/*
 Class class definition
*/
var classClass = "http://mu.semte.ch/vocabularies/school/Class";
var classBase = "http://mu.semte.ch/school/classes/";
var classProperties = [
    {
        key: "name",
        predicate: "http://purl.org/dc/terms/title",
        type: {
            type: "string",
            options: {}
        }
    },
    {
        key: "subject",
        predicate: "http://purl.org/dc/terms/subject",
        type: {
            type: "relation",
            options: {
                relationClass: subjectClass,
                relationBase: subjectBase,
                relationProperties: subjectProperties
            }
        }
    },
    {
        key: "teachers",
        predicate: "http://mu.semte.ch/vocabularies/school/hasTeacher",
        type: {
            type: "relation",
            options: {
                relationClass: personClass,
                relationBase: personBase,
                relationProperties: personProperties
            }
        }
    },
    {
        key: "students",
        predicate: "http://mu.semte.ch/vocabularies/school/hasStudent",
        type: {
            type: "relation",
            options: {
                relationClass: personClass,
                relationBase: personBase,
                relationProperties: personProperties
            }
        }
    },
    {
        key: "grades",
        predicate: "http://mu.semte.ch/vocabularies/school/classGrade",
        type: {
            type: "relation",
            options: {
                relationClass: gradeClass,
                relationBase: gradeBase,
                relationProperties: gradeProperties
            }
        }
    }
]

var result;

var run = function(){
    console.log("Running");
    // School Principle
    var principle = generators.getRandomPerson();
    principle.role = "principle";
    principle.uri = "<http://mu.semte.ch/users/principle>";
    result = helpers.writeObjectToStore(principle, personClass, personBase, personProperties);
    console.log(result);

    // Students
    var s, students = [], studentObj;
    for(var i = 0; i < N_STUDENTS; i++){
        studentObj = generators.getRandomPerson();
        studentObj.role = "student";
        studentObj.uri = "<http://mu.semte.ch/users/student" + i + ">";
        result = helpers.writeObjectToStore(studentObj, personClass, personBase, personProperties);
        students.push(result);
    }
    console.log(students);

    // Subjects
    var subjects = [], index, subj;
    for(index in subjectList.subjects){
        subj = subjectList.subjects[index];
        subjects[subj] = helpers.writeObjectToStore({
            name: subj
        }, subjectClass, subjectBase, subjectProperties);
    }
    console.log(subjects);

    // Teachers and classes
    var teacherObj, teacher, clss, classes = [];
    for(var i = 0; i < N_TEACHERS; i++){
        teacherObj = generators.getRandomPerson();
        teacherObj.role = "teacher";
        teacherObj.uri = "<http://mu.semte.ch/users/teacher" + i + ">";
        teacher = helpers.writeObjectToStore(teacherObj, personClass, personBase, personProperties);

        for(var j = 0; j < N_CLASSES_PER_TEACHER; j++){
            clss = generators.getRandomClass();
            clss.subject = [subjects[clss.subject]];
            clss.teachers.push(teacher);

            var s, grade, st; 
            for(var k = 0; k < N_STUDENTS_PER_CLASS; k++){
                do {
                    st = students[generators.getRandomNumber(0, N_STUDENTS-1)];
                }
                while ( clss.students.indexOf(st) > -1 )
                clss.students.push(st);

                console.log("STUDENTS:");
                console.log(clss.students);


                grade = helpers.writeObjectToStore({ 
                    points: generators.getRandomNumber(0, 20),
                    student: [st]
                }, gradeClass, gradeBase, gradeProperties);
                clss.grades.push(grade);

            }
            result = helpers.writeObjectToStore(clss, classClass, classBase, classProperties);
            console.log(result);
            classes.push(clss);
        }
    }
}

module.exports = {
    run: run
}

const repl = require('repl');


