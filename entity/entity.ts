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
    fireStore: AngularFirestore;

    constructor(private fsService: AngularFirestore, params?) {
        this.fireStore = fsService;
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

    static _documentToObject(fireStore, document): any {
        let id;
        let data;

        try {

            if (document.payload.doc == undefined) {
                data = document.payload.data();
                id = document.payload.id;
            } else {

                data = document.payload.doc.data();
                id = document.payload.doc.id;
            }

            return Reflect.construct(this, [fireStore, { id, ...data }]);
        } catch (e) {
            throw new Error("This document doesn't exist.");
        }
    }

    static _getFromSnapshot(fireStore, collection): Observable<any[]> {
        return new Observable(observer => {
            let self = this;
            collection.snapshotChanges().subscribe(result => {
                let documents = [];
                result.map(action => {
                    try{
                        let document = this._documentToObject(fireStore, action);
                        documents.push(document);
                        
                    }catch(e){
                        observer.error(new Error(e));
                    }
                });
                
                observer.next(documents);
                observer.complete();
                

            });
        });
    }

    static get(fireStore: AngularFirestore, id): Observable<any> {
        return new Observable(observer => {

            let result$: Observable<any>;
            let document: any = fireStore.doc<any>(this.className() + "/" + id);
            document.snapshotChanges().subscribe(result => {
                try {
                    let doc = Entity._documentToObject(fireStore, result);
                    observer.next(doc);
                    observer.complete();
                } catch (e) {
                    observer.error(new Error(e.message));
                } finally {
                    
                }
            });


        });
    }

    static getAll(fireStore: AngularFirestore, collectionName?): Observable<any[]> {

        if (collectionName == undefined)
            collectionName = this.className()

        return new Observable(observer => {
            let collection: AngularFirestoreCollection<any> = fireStore.collection<any>(collectionName);

            this._getFromSnapshot(fireStore, collection).subscribe(result => {
                let documents = result;
                observer.next(documents);
                observer.complete();
            },err=>{
                observer.error(err);
            });

        });

    }

    static deleteAll(fireStore:AngularFirestore, collectionName?): Observable<void> {

        return new Observable<void>(observer => {

            if (collectionName == undefined)
                collectionName = this.className()
            let collection: AngularFirestoreCollection<any> = fireStore.collection<any>(collectionName);
            this.getAll(fireStore, collectionName).subscribe(result => {
                let documents = [];

                for (let i = 0; i < result.length; i++) {
                    documents.push(result[i].delete(collectionName));
                }

                Promise.all(documents).then(result => {
                    observer.next();
                    observer.complete();
                });

            }, err=>{
                observer.error(err);
            })

        });
    }

    delete(collectionName?): Promise<void> {
        if (collectionName == undefined)
            collectionName = this.className()
        let collection: AngularFirestoreCollection<any> = this.fireStore.collection<any>(collectionName);

        let has = this.generateOwnership();
        has.forEach(element => {
            Entity.deleteAll(this.fireStore, element);
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
    static count(fireStore: AngularFirestore, collectionName?): Observable<number> {
        if (collectionName == undefined)
            collectionName = this.className()
        return new Observable<number>(observer => {
            let collection: AngularFirestoreCollection<any> = fireStore.collection<any>(collectionName);
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
            if (relationships[key].id != undefined) {
                // TODO: update
            } else {
                promises.push(relationships[key].add());
            }

        }
        return Promise.all(promises);
    }



    add(): Promise<any> {
        //let inspector = ReflectiveInjector.resolveAndCreate([AngularFirestore]) 
        //let firestore:AngularFirestore = inspector.get(AngularFirestore);
        let collection: AngularFirestoreCollection<any> = this.fireStore.collection<any>(this.className());
        let _this = this; // this is lost in promise.
        return new Promise<this>(function (resolve, reject) {

            let savingRelationships = _this.saveRelationships();
            savingRelationships.then(result => {
                collection.add(_this.toObject()).then(result => {
                    _this.id = result.id;

                    resolve(_this);
                });

            });
        });
    }
}
