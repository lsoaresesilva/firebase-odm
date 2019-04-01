import { AngularFireModule, FirebaseApp } from '@angular/fire';
import { FirebaseConfig } from '../../environments/firebase.config';
import { AngularFirestoreModule, AngularFirestore } from '@angular/fire/firestore';
import { TestBed, inject, getTestBed } from "@angular/core/testing";
import { oneToOne } from './onetoone';
import { Person, Student, ResearchGroup, ClassRoom, Scholarship } from './tests/models'


describe('Document tests', () => {
  let app: firebase.app.App;
  let afs: AngularFirestore;

  function firestoreCleanUp(done) {

    Person.deleteAll(afs).subscribe(result => {
      ResearchGroup.deleteAll(afs).subscribe(result => {
        Student.deleteAll(afs).subscribe(result => {
          ClassRoom.deleteAll(afs).subscribe(result => {
            Scholarship.deleteAll(afs).subscribe(result => {
              done();
            })
          })

        })
      })

    });
  }

  function insertOnFireStore() {
    let s = new Student(afs);
    let p = new Person(afs)
    let g = new ResearchGroup(afs)
    let c = new ClassRoom(afs);
    s.person = p;
    s.group = g;
    s.class = c;
    return s.add();
  }

  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 1200000;
    TestBed.configureTestingModule({
      imports: [
        AngularFireModule.initializeApp(FirebaseConfig),
        AngularFirestoreModule//.enablePersistence()
      ]
    });
    inject([FirebaseApp, AngularFirestore], (_app: firebase.app.App, _afs: AngularFirestore) => {

      app = _app;
      afs = _afs;
    })();

  });



  afterEach(() => {
    getTestBed().resetTestingModule();
  });

  it('should save one document without relationships', done => {
    let p = new Person(afs);
    p.add().subscribe(result => {

      expect(result.id).toBeDefined();
      Person.deleteAll(afs).subscribe(result => {
        done();
      });

    });
  });

  it("Should save one document with relationship", done => {
    insertOnFireStore().subscribe(resultado => {
      expect(resultado.id).toBeDefined();
      expect(resultado.person.id).toBeDefined();
      expect(resultado.group.id).toBeDefined();
      firestoreCleanUp(done);

    })
  });

  it("Should update a document without relationships ", done => {
    let p = new Person(afs);
    p.name = "Leonardo";
    p.add().subscribe(result => {
      console.log("id");
      console.log(result.id);

      expect(result.name).toBe("Leonardo");
      p.name = "Davi";
      p.update().subscribe(result => {
        Person.get(afs, p.id).subscribe(updatedPerson => {
          console.log("oiiii");
          console.log(updatedPerson);
          expect(updatedPerson.name).toBe("Davi");
          /*Person.deleteAll(afs).subscribe(result => {
            done();
          });*/
          done();
        });

      });
      //done();

    });

  });

  // TODO : tentar atualizar obj que n existe, deve salvar
  // TODO: fazer update de document que tenha relationships. entrar recursivamente em todos os relationships


  it("should count documents inside a collection", (done) => {

    /*Student.deleteAll(afs).subscribe(result => {
      Student.count(afs).subscribe(result => {
        expect(result).toBe(0);
        let s = new Student(afs);
        s.add().subscribe(result => {
          Student.count(afs).subscribe(result => {
            expect(result).toBe(1);
            done();
          });
        })


      })
    });*/
    done();
  });

  it("Should save a one to one relationships", done => {
    let s = new Student(afs);
    let p = new Person(afs)
    let sc = new Scholarship(afs);

    s.person = p;
    s.scholarship = sc;

    spyOn(s.person, 'add').and.callThrough();
    spyOn(s.scholarship, 'add').and.callThrough();
    s.saveOneToOne().subscribe(resultado => {
      expect(s.person.add).toHaveBeenCalled();
      expect(s.person.id).toBeDefined();
      expect(s.scholarship.add).toHaveBeenCalled();
      expect(s.scholarship.id).toBeDefined();
      done();
    })
  })

  it("Should save a many to one relationship", done => {
    let s = new Student(afs);
    let g = new ResearchGroup(afs)
    let c = new ClassRoom(afs);
    s.class = c;
    s.group = g;
    spyOn(s.class, 'add').and.callThrough();
    spyOn(s.group, 'add').and.callThrough();
    s.saveManyToOne().subscribe(resultado => {
      expect(s.class.add).toHaveBeenCalled();
      expect(s.class.id).toBeDefined();
      expect(s.group.add).toHaveBeenCalled();
      expect(s.group.id).toBeDefined();

      done();
    })
  })



  /*it("should return all documents from a collection", (done) => {
    insertOnFireStore().subscribe(result => {
      Student.getAll(afs).subscribe(result => {
        expect(result.length).toBe(1);
        done();
      })
    })
  });
  
  
  /*  
  it("should fail to load a object from a document that does not exists", (done) => {

    expect(function () {
      Student.get(afs, "1").subscribe();
    }).toThrow();

  })*/
})