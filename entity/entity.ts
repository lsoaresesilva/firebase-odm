import { ReflectiveInjector } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from "angularfire2/firestore";
import { Observable } from 'rxjs';


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

// any parameters, even optional ones!

export function manyToOne(args: any) {
    // the original decorator
    let x = args;
    let opa = Object.create(x.document, {})
    console.log(opa.constructor.name)
    function actualDecorator(target, property: string | symbol): void {
        if (args.document != undefined) {
            if (target._manyToOne == undefined)
                Object.defineProperty(target, '_manyToOne', {
                    value: [],
                    writable: true,
                    enumerable: true
                })

            target._manyToOne[args.document.constructor.name] = args.document
        }
    }

    // return the decorator
    return actualDecorator;
}

export function id(target, key) {
    Object.defineProperty(target, '__id', {
        value: key
    })
}

export class Entity {

    __id: any;
    id?: string;

    has?: any[]; // Trocar por has
    protected fireStore: AngularFirestore;

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

    _build(params?) { // constrói um objeto js a partir de um dado chave-valor.
        if (params != undefined && typeof params == "object") {

            for (let key in params) {
                if (params[key] != undefined) {
                    this[key] = params[key];
                }
            }
        }
    }

    /*generateOwnership() {
        let has = []
        if (this.has != undefined) {
            this.has.forEach(element => {
                has.push(new element().className());
            });
        }
        return has;
    }*/

    /*
        Pass over all keys in the object
    */
    toObject() {
        let x = Reflect.ownKeys(this)
        let myObj = {}
        x.forEach(element => {

            if (typeof this[element] != "function" && typeof this[element] != "object")
                myObj[element] = this[element]
            else if (Entity.isDocument(this[element])) {
                let nome = myObj[this[element].className()];
                //myObj[this[element].className()] = this[element].toObject()

                if (this[element].__id != undefined) { // verify if object was decorated with @id
                    // TODO: oferecer suporte para que os objetos possam ser associados com outro nome além do nome do document
                    myObj[this[element].className()] = this[element].__id;
                } else {
                    myObj[this[element].className()] = this[element].id;
                }

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

    static __documentToObject(fireStore, document): any {
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

            return [fireStore, { id, ...data }];
        } catch (e) {
            throw new Error("This document doesn't exist.");
        }
    }

    static _documentToObject(fireStore, document, classCaller): any {
        let id;
        let data;

        try {
            if ((document.payload.exists != undefined && document.payload.exists == true) ||
                document.payload.doc != undefined && document.payload.doc.exists == true) {


                if (document.payload.doc == undefined) {
                    data = document.payload.data();
                    id = document.payload.id;
                } else {

                    data = document.payload.doc.data();
                    id = document.payload.doc.id;
                }
                let propriedades = {}
                propriedades['id'] = {
                    value: id,
                    writable: true,
                    enumerable: true
                }
                propriedades['fireStore'] = {
                    value: fireStore,
                    writable: true,
                    enumerable: true
                }

                if (typeof data == "object") {
                    let x = Reflect.ownKeys(data)
                    x.forEach(element => {
                        propriedades[element] = {
                            value: data[element],
                            writable: true,
                            enumerable: true
                        }
                        if (classCaller.prototype._manyToOne != undefined) {
                            if (classCaller.prototype._manyToOne[element] != undefined) {
                                let obje = classCaller.prototype._manyToOne[element];
                                if (typeof obje.constructor.get == "function") {
                                    obje.constructor.get(fireStore, data[element]).subscribe(result => {
                                        propriedades[element] = result;
                                    })
                                }

                            }
                        }


                    });

                    return Object.create(this.prototype, propriedades);
                }
            } else {
                throw new Error("This document doesn't exist.");
            }
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
                    try {
                        let document = this._documentToObject(fireStore, action, this);
                        documents.push(document);

                    } catch (e) {
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
            let className = this.className();
            let document: any = fireStore.doc<any>(this.className() + "/" + id);
            document.snapshotChanges().subscribe(result => {
                try {
                    let doc = this._documentToObject(fireStore, result, this);
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
            }, err => {
                observer.error(err);
            });

        });

    }

    static deleteAll(fireStore: AngularFirestore, collectionName?): Observable<void> {

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

            }, err => {
                observer.error(err);
            })

        });
    }

    delete(collectionName?): Promise<void> {
        if (collectionName == undefined)
            collectionName = this.className()
        let collection: AngularFirestoreCollection<any> = this.fireStore.collection<any>(collectionName);

        /*let has = this.generateOwnership();
        has.forEach(element => {
            Entity.deleteAll(this.fireStore, element);
        });*/

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

    update(): Observable<any> {
        let _this = this; // this is lost in promise.
        console.log(this.className)
        //let collection: AngularFirestoreCollection<any> = _this.fireStore.collection<any>(_this.className());
        return new Observable(observer => {

            let savingRelationships = _this.saveRelationships();
            savingRelationships.then(result => {
                let json = _this.toObject();
                _this.fireStore.doc(_this.className() + "/" + _this.id).update(_this.toObject()).then(result => {

                    observer.next();
                    observer.complete();

                });

            });

        });
    }
}
