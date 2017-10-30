import { FirebaseApp, FirebaseAppConfig, AngularFireModule } from 'angularfire2';
import { AngularFireDatabase, AngularFireDatabaseModule } from 'angularfire2/database';
import { inject } from '@angular/core/testing';
import { COMMON_CONFIG } from './test-config';
import { AngularFirestore, AngularFirestoreModule } from "angularfire2/firestore";
import { TestBed } from "@angular/core/testing";
import { Entity } from "./entity";
import * as firebase from 'firebase/app';

let RUN_TESTS = true;

if (RUN_TESTS) {
  describe('Entity tests', () => {
    let app: firebase.app.App;
    let afs: AngularFirestore;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [
          AngularFireModule.initializeApp(COMMON_CONFIG),
          AngularFirestoreModule.enablePersistence()

        ]
      });
      inject([FirebaseApp, AngularFirestore], (_app: firebase.app.App, _afs: AngularFirestore) => {

        app = _app;
        afs = _afs;
      })();
    });

    afterEach(async (done) => {
      await app.delete();
      done();
    });


    it('should get the class name', () => {
      class MyClass extends Entity {

      }
      let myclass: MyClass = new MyClass(null);
      expect(MyClass.className()).toBe("MyClass");
    })

    it('should get document model', () => {
      class Pet extends Entity {
        name: string = "Bob"
        id: string = "89";
      }

      class Person extends Entity {
        myPet: Pet
        name: string = "Leonardo"
        id: string = "90";
        //@ownership
        has: any[] = [Pet]
      }

      let mp = new Pet(null);
      let p = new Person(null);
      p.myPet = mp;
      expect(p.toObject()).toEqual({ name: "Leonardo", id: "90", Pet: "89" });

      class Job extends Entity {
        person: Person;
        name: string = "Analista"
        id: string = "91";
      }

      class Enterprise extends Entity {
        job: Job;
      }



      p = new Person(null);
      let e = new Enterprise(null);
      let j = new Job(null);
      e.job = j
      j.person = p

      expect(e.toObject()).toEqual({ Job: "91" });
    })

    it("should generate a ownership array", () => {

      class Pet extends Entity {
        name: string = "Bob"
        id: string = "89";
      }
      class Person extends Entity {
        myPet: Pet
        name: string = "Leonardo"
        id: string = "90";
        has: any[] = [Pet]
      }
      let p = new Person(null);
      let result = ["Pet"]

      expect(p.generateOwnership()).toEqual(result);

      class Enterprise extends Entity {

      }

      let secondResult = []
      let e = new Enterprise(null);
      expect(e.generateOwnership()).toEqual(secondResult);
    });

    it("should remove all documents related to a parent document", done => {

      class Student extends Entity {
        name: string = "Leonardo";

      }

      /*let s1 = new Student(afs);
      let s2 = new Student(afs);
      let s3 = new Student(afs);
      let savedResults = [];
      savedResults.push(s1.add());
      savedResults.push(s2.add());
      savedResults.push(s3.add());
      Promise.all(savedResults).then(result => {
        expect(Student).toBe(3);

        
      });*/

      Student.deleteAll(afs).subscribe(result => {
        Student.count(afs).subscribe(result => {
          expect(result).toBe(0);
          done();
        })
      });

    })

    it("should count the number of documents inside a collection", done => {
      class Student extends Entity {
        name: string = "Leonardo";

      }

      let s1 = new Student(afs);
      Student.deleteAll(afs).subscribe(result => {
        s1.add().then(result => {
          let id = s1.id;
          Student.count(afs).subscribe(result => {
            expect(result).toBe(1);
            Student.deleteAll(afs).subscribe(result => {
              done();
            });

          })
        })
      })

    })

    it("should save an instance", done => {
      class Animal extends Entity {
        //@belongsTo
        name: string = null;
      }

      //let mock = new AngularFirestoreMock(new FirebaseAppMock(), null);
      let animal: Animal = new Animal(afs);
      animal.name = "Bob"
      Animal.deleteAll(afs).subscribe(result => {
        animal.add().then(result => {

          expect(result.id).toBeTruthy();
          Animal.count(afs).subscribe(result => {
            expect(result).toBe(1);
            Animal.deleteAll(afs).subscribe(result => {
              done();
            });
          })


        });
      });
    }
    )

    it("should return a list of relationships from document", () => {
      class Person extends Entity {
        name: string = "Leonardo"
      }

      class Job extends Entity {
        person: Person;
        name: string = "Analista"
      }

      class Enterprise extends Entity {
        job: Job;
        manager: Person;
      }

      let p = new Person(null);
      let j = new Job(null);
      let e = new Enterprise(null);
      e.job = j;
      e.manager = p;

      let result = []
      result["Person"] = p
      result["Job"] = j
      expect(e.relationships()).toEqual(result);
    })

    it("should save recursirvely an instance", done => {
      class Animal extends Entity {
        name: string = null;
        person: Person;
      }

      class Person extends Entity {
        name: string = null;
        has = [Animal]
      }


      let person: Person = new Person(afs);
      let animal: Animal = new Animal(afs);
      animal.name = "Bob";
      animal.person = person;
      person.name = "Leonardo";
      Animal.deleteAll(afs).subscribe(result => {
        animal.add().then(result => {

          expect(result.id).toBeTruthy();
          Animal.count(afs).subscribe(result => {
            expect(result).toBe(1);
            Animal.deleteAll(afs).subscribe(result => {
              done();
            });
          })


        });
      });
    }
    )

    it("should save recursirvely an instance which its parent was saved before", done => {
      class Animal extends Entity {
        name: string = null;
        person: Person;
      }

      class Person extends Entity {
        name: string = null;
        has = [Animal];
        id: string;
      }


      let person: Person = new Person(afs);
      let animal: Animal = new Animal(afs);
      animal.name = "Bob";
      animal.person = person;
      person.name = "Leonardo - saved";
      person.id = '123456';
      Animal.deleteAll(afs).subscribe(result => {
        animal.add().then(result => {

          expect(result.id).toBeTruthy();
          Animal.count(afs).subscribe(result => {
            expect(result).toBe(1);
            Person.count(afs).subscribe(result => {
              Animal.deleteAll(afs).subscribe(result => {
                done();
              });
            })

          })


        });
      });
    }
    )

    /*it('should remove self from database', done => {
        class Animal extends Entity {
            name: string = null;
        }
 
        let a = new Animal(afs);
        a.add().then(result => {
            expect(collectionMock.size).toBe(1);
            a.delete().then(result => {
                expect(collectionMock.get("Animal").length).toBe(0);
                done();
            })
        })
 
 
    });
 
   
 
    it('should remove self and its related documents from database ', () => {
        class School extends Entity {
            name: string = null;
            has = [Student]
        }
 
        class Student extends Entity {
            name: string = "Leonardo";
            school: School = null;
        }
 
        let s = new School(afs);
        let student = new Student(afs);
        student.school = s;
        student.add();
        expect(Object.keys.length).toBe(1);
        //expect(School.deleteAll()).toBe("Animal");
 
    });
 
    it("should build a new model based on params", () => {
        class Student extends Entity {
 
 
        }
 
        let s = new Student(afs);
        s._build({ name: "Leonardo", age: 30 });
        expect(s['name']).toBe("Leonardo");
        expect(s['age']).toBe(30);
 
    });
 
 
 
    it("should return all documents within a Collection", done => {
        class Student extends Entity {
            name: string = "Leonardo";
 
        }
 
        let s1 = new Student(afs);
        let s2 = new Student(afs);
        let s3 = new Student(afs);
        let savedResults = [];
        savedResults.push(s1.add());
        savedResults.push(s2.add());
        savedResults.push(s3.add());
        Promise.all(savedResults).then(result => {
            let expectedResult = []
            expectedResult.push(new Student(afs), new Student(afs), new Student(afs));
            Student.getAll().subscribe(result => {
                expect(result.length).toBe(3);
                done();
            });
            //expect(Entity.getAll()).toEqual(expectedResult);
        });
    })
 
    it('should return one document based on ID', done=>{
        class Student extends Entity {
            name: string = "Leonardo";
 
        }
 
        let s1 = new Student(afs);
        s1.add().then(result => {
            let id = s1.id;
            Student.get(id).subscribe(result=>{
                expect(result.id).toBe(id);
                done();
            })
        })
    })*/
  })
}