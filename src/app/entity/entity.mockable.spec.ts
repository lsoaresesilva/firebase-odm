import { Entity, ownership } from "./entity";
import { TestBed } from "@angular/core/testing";
import { async } from "@angular/core/testing";
import { AppComponent } from "../app.component";
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from "angularfire2/firestore";
import { QueryFn, DocumentChangeAction } from "angularfire2/firestore/interfaces";
import * as firebase from 'firebase/app';
import { FirebaseApp } from "angularfire2";
import { Observable } from "rxjs/Observable";

//import { belongsTo } from './entity';

let collectionMock:Map<string, any[]>;

class AngularFirestoreDocumentMock<T> extends AngularFirestoreDocument<T>{
    delete(): Promise<void> {
        let self = this;
        return new Promise<void>(function (resolve, reject) {
            if (collectionMock.has(self.ref.path)) {
                collectionMock.delete(self.ref.path);
            }
            resolve();
        });
    }
}

class FirebaseAppMock implements firebase.app.App {
    auth(): firebase.auth.Auth {
        return null;
    }
    database(): firebase.database.Database {
        return null;
    }
    delete(): Promise<any> {
        return new Promise<void>(function (resolve, reject) {
            resolve();
        });
    }
    messaging(): firebase.messaging.Messaging {
        return null;
    }
    name: string;
    options: Object;
    storage(url?: string): firebase.storage.Storage {
        return null;
    }
    firestore(): firebase.firestore.Firestore {
        return null;
    }
}

class AngularFirestoreCollectionMock<T> extends AngularFirestoreCollection<T>{

    constructor(ref: firebase.firestore.CollectionReference, query: firebase.firestore.Query) {
        super(ref, query);
    }

    snapshotChanges(events?: firebase.firestore.DocumentChangeType[]): Observable<DocumentChangeAction[]>{
        let self = this;
        return new Observable<DocumentChangeAction[]>(observer=>{
            let result = [];
            for(let key in collectionMock){
                if(key == self.ref.path){
                    for(let i = 0; i < collectionMock[key].length; i++){
                        let document = { 
                            payload:{
                                doc:{
                                    data:function(){
                                        let doc = {}
                                        for(let k in collectionMock[key][i]){
                                            doc[k] = collectionMock[key][i][k];
                                        }
                                        return doc;
                                    },
                                    id:collectionMock[key][i].id
                                }
                            }
                        };
                        result.push(document);
                        /*let document:DocumentChangeAction = {
                            payload:{
                                type:null, 
                                doc:{
                                    exists:true,
                                    ref:{
                                       id:collectionMock[key][i].id,
                                       firestore:null,
                                       parent:null,
                                       path:self.ref.path,
                                       collection:null,
                                       isEqual():null,


                                    },
                                    id:collectionMock[key][i].id
                                }},
                            type:null};*/

                    }
                }
            }
            observer.next(result);
            observer.complete();
        });
    }

    add(data): Promise<firebase.firestore.DocumentReference> {

        data.id = (data.id == undefined) ? "" + Math.random() : data.id;
        data.path = this.ref.path;
        let self = this;
        return new Promise(function (resolve, reject) {
            let x = collectionMock[self.ref.path]
            if (collectionMock[self.ref.path] == undefined) {
                collectionMock[self.ref.path] = [];
            }
            collectionMock[self.ref.path].push(data);
            resolve(data);
        });
    }

    doc(path: string): AngularFirestoreDocumentMock<{}> {
        let document: firebase.firestore.DocumentReference = {
            id: "123",
            collection: null,
            isEqual: null,
            set: null,
            update: null,
            delete: null,
            get: null,
            onSnapshot: null,
            path: path, parent: null, firestore: null,

        };
        document.delete = function (): Promise<any> {
            return new Promise<void>(function (resolve, reject) {
                
                resolve();
            });
        }
        return new AngularFirestoreDocumentMock(document);
    }
}

class AngularFirestoreMock extends AngularFirestore {

    constructor(app: FirebaseApp, shouldEnablePersistence: any) {
        super(app, shouldEnablePersistence);
    }

    collection<T>(path: string, queryFn?: QueryFn): AngularFirestoreCollectionMock<T> {

        let myCollection: firebase.firestore.CollectionReference = {
            id: "" + Math.random(),
            parent: null,
            path: path,
            doc: null,
            add: null,
            firestore: null,
            where: null,
            orderBy: null,
            limit: null,
            startAt: null,
            startAfter: null,
            endAt: null,
            endBefore: null,
            isEqual: null,
            get: null,
            onSnapshot: null,

        }

        return new AngularFirestoreCollectionMock<T>(myCollection, null);
    }
}

describe('Mock Entity tests', () => {

    let mock;

    beforeEach(() => {
        mock = new AngularFirestoreMock(new FirebaseAppMock(), null);
        collectionMock = new Map();
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
            ownership: any[] = [Pet]
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
            ownership: any[] = [Pet]
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

    it("should save an instance", done => {
        class Animal extends Entity {
            //@belongsTo
            name: string = null;
        }

        //let mock = new AngularFirestoreMock(new FirebaseAppMock(), null);
        let animal: Animal = new Animal(mock);
        animal.name = "Bob"
        animal.salvar().then(result => {
            expect(Object.keys(collectionMock).includes("Animal")).toBeTruthy();
            expect(collectionMock["Animal"].length).toBe(1);
            done();
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
            ownership = [Animal]
        }


        let person: Person = new Person(mock);
        let animal: Animal = new Animal(mock);
        animal.name = "Bob";
        animal.person = person;
        person.name = "Leonardo";
        animal.salvar().then(result => {
            expect(Object.keys(collectionMock).length).toBe(2);
            expect(collectionMock['Animal'][0].Person).toBe(collectionMock['Person'][0].id);
            done();
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
            ownership = [Animal];
            id: string;
        }


        let person: Person = new Person(mock);
        let animal: Animal = new Animal(mock);
        animal.name = "Bob";
        animal.person = person;
        person.name = "Leonardo - saved";
        person.id = '123456';
        animal.salvar().then(result => {
            expect(Object.keys(collectionMock).length).toBe(2);
            expect(collectionMock['Animal'][0].Person).toBe("123456");
            done();
        });
    }
    )

    it('should remove self from database', done => {
        class Animal extends Entity {
            name: string = null;
        }

        let a = new Animal(mock);
        a.delete().then(result => {
            done();
        })

    });

    it("should remove all documents related to a parent document", done => {

        class Student extends Entity {
            name: string = "Leonardo";

        }

        let s1 = new Student(mock);
        let s2 = new Student(mock);
        let s3 = new Student(mock);
        let savedResults = [];
        savedResults.push(s1.salvar());
        savedResults.push(s2.salvar());
        savedResults.push(s3.salvar());
        Promise.all(savedResults).then(result => {
            expect(Object.keys(collectionMock).length).toBe(1);
            Student.deleteAll().then(result => {
                let x = result;
            });
        });

    })

    it('should remove self and its related documents from database ', () => {
        class School extends Entity {
            name: string = null;
            ownership = [Student]
        }

        class Student extends Entity {
            name: string = "Leonardo";
            school: School = null;
        }

        let s = new School(mock);
        let student = new Student(mock);
        student.school = s;
        student.salvar();
        expect(Object.keys.length).toBe(1);
        //expect(School.deleteAll()).toBe("Animal");

    });

    it("should build a new model based on params", ()=>{
        class Student extends Entity {
            

        }

        let s = new Student(mock);
        s._build({name:"Leonardo", age:30});
        expect(s['name']).toBe("Leonardo");
        expect(s['age']).toBe(30);
        
    });

    it("should return all documents within a Collection", ()=>{
        class Student extends Entity {
            name: string = "Leonardo";

        }

        let s1 = new Student(mock);
        let s2 = new Student(mock);
        let s3 = new Student(mock);
        let savedResults = [];
        savedResults.push(s1.salvar());
        savedResults.push(s2.salvar());
        savedResults.push(s3.salvar());
        Promise.all(savedResults).then(result => {
            let expectedResult = []
            expectedResult.push(new Student(mock), new Student(mock), new Student(mock));
            Student.getAll().subscribe(result =>{
                 expect(result.length).toBe(3);
            });
            //expect(Entity.getAll()).toEqual(expectedResult);
        });
    })    
})