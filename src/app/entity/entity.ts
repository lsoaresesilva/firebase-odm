import { ReflectiveInjector } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from "angularfire2/firestore";
import { Observable } from "rxjs/Observable";

// Aluno -> Escola
// 
//

export function ownership(target, property) {
    let ownership = []

    if (this.ownership != undefined) {
        this.ownership.forEach(element => {
            ownership.push(new element().className());
        });
    }
    this.ownership = ownership;
}

export class Entity {

    id?: string;
    has?: any[]; // Trocar por has
    static fireStore: AngularFirestore;

    constructor(private fsService: AngularFirestore, params?) {
        Entity.fireStore = fsService;
        this._build(params);
        //this.ownership = [];
    }

    private static isDocument(document) {
        if (typeof document == "object" && document != null && typeof document.toObject == "function")
            return true
        return false
    }

    _build(params?) {
        if (params != undefined && typeof params == "object") {

            for (let key in params) {
                if (params[key] != undefined) {
                    this[key] = params[key];
                }
            }
        }
    }

    generateOwnership() {
        let has = []
        if (this.has != undefined) {
            this.has.forEach(element => {
                has.push(new element().className());
            });
        }
        return has;
    }

    toObject() {
        let x = Reflect.ownKeys(this)
        let myObj = {}
        x.forEach(element => {

            if (typeof this[element] != "function" && typeof this[element] != "object")
                myObj[element] = this[element]
            else if (Entity.isDocument(this[element])) {
                //myObj[this[element].className()] = this[element].toObject()
                myObj[this[element].className()] = this[element].id;
            } else if (typeof this[element] == "object" && element == "has") {
                //myObj[element] = this.generateOwnership();
            }
        });
        return myObj
    }
    static className(): string {
        return this.toString().split('(' || /s+/)[0].split(' ' || /s+/)[1];
    }

    className(): string {
        return this.constructor.name;
    }

    static _getFromSnapshot(fireStore, collection): Observable<any[]> {
        return new Observable(observer => {
            let self = this;
            collection.snapshotChanges().subscribe(result => {
                let documents = [];
                result.map(action => {

                    const data = action.payload.doc.data();
                    const id = action.payload.doc.id;
                    let document = Reflect.construct(this, [fireStore, { id, ...data }]);
                    documents.push(document);
                });

                observer.next(documents);
                observer.complete();

            });
        });
    }

    static getAll(fireStore:AngularFirestore): Observable<any[]> {


        return new Observable(observer => {
            let collection: AngularFirestoreCollection<any> = fireStore.collection<any>(this.className());
            this._getFromSnapshot(fireStore, collection).subscribe(result => {
                let documents = result;
                observer.next(documents);
                observer.complete();
            });

        });

    }

    static deleteAll(fireStore): Observable<void> {


        return new Observable<void>(observer => {
            let collection = fireStore.collection(this.className());
            this.getAll(fireStore).subscribe(result => {
                let documents = [];

                for (let i = 0; i < result.length; i++) {
                    documents.push(result[i].delete());
                }

                Promise.all(documents).then(result => {
                    observer.next();
                    observer.complete();
                });

            })

        });
    }

    delete(): Promise<void> {
        let x = this.className();
        let collection: AngularFirestoreCollection<any> = Entity.fireStore.collection<any>(this.className());

        let has = this.generateOwnership();
        has.forEach(element => {
            element.deleteAll();
        });

        return collection.doc(this.id).delete();
    }



    /**
     * Returns all documents which belongs to the document.
     */
    relationships() {
        let x = Reflect.ownKeys(this)
        let myObj = []
        for (let key in x) {

            if (Entity.isDocument(this[x[key]])) {

                myObj[this[x[key]].className()] = this[x[key]];

            }
        }
        return myObj
    }

    /**
     * Returns the size of document's inside a collection.
     */
    static count(fireStore:AngularFirestore): Observable<number> {
        return new Observable<number>(observer => {
            let collection: AngularFirestoreCollection<any> = fireStore.collection<any>(this.className());
            this._getFromSnapshot(fireStore, collection).subscribe(result => {
                observer.next(result.length);
                observer.complete();
            })
        });
    }

    /**
     * Save all documents which belongs to the document.
     * Not to be called directly. This is called by save() to recursively save all documents.
     */
    saveRelationships(): Promise<any> {
        let promises: any[] = [];
        let relationships = this.relationships();
        for (let key in relationships) {

            promises.push(relationships[key].add());
        }
        return Promise.all(promises);
    }

    static get(fireStore:AngularFirestore, id): Observable<any> {
        let result$: Observable<any>;
        let collection: AngularFirestoreCollection<any> = fireStore.collection<any>(this.className() + "/" + id);

        return Entity._getFromSnapshot(fireStore, collection);
    }

    add(): Promise<any> {
        //let inspector = ReflectiveInjector.resolveAndCreate([AngularFirestore]) 
        //let firestore:AngularFirestore = inspector.get(AngularFirestore);
        let collection: AngularFirestoreCollection<any> = Entity.fireStore.collection<any>(this.className());
        let myself = this; // this is lost in promise.
        return new Promise<this>(function (resolve, reject) {
            let relations = myself.relationships()
            if (Object.keys(relations).length > 0) {
                let savingRelationships = myself.saveRelationships();
                savingRelationships.then(result => {
                    collection.add(myself.toObject()).then(result => {
                        myself.id = result.id;

                        resolve(myself);
                    });
                })
            } else {
                collection.add(myself.toObject()).then(result => {
                    myself.id = result.id;

                    resolve(myself);
                });
            }


        });
    }



}

