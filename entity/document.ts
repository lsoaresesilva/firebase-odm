import { ManyToOneRelationship } from './manytoone';
import { OneToOneRelationship } from './onetoone';
import { AngularFirestoreModule, AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Observable, forkJoin } from 'rxjs';
import { FireStoreQuery } from './query'
import { FireStoreDocument } from './firestoreDocument';
import { DocumentMapper } from "./documentMapper";
import { Relationship } from './relationship';

/*
export function id(target, key) {
    Object.defineProperty(target, '__id', {
        value: key
    })
}
*/

export function Collection(nome){
    return function(target){
        target.__name = nome;
    }
}

export class Document {

    __id: any;
    id?: string;

    constructor(private fsService: AngularFirestore) {
        this.fireStore = fsService;
    }

    protected fireStore: AngularFirestore;

    preAdd() {

    }

    /*
        Pass over all keys in the object
    */
    toObject() {
        let x = Reflect.ownKeys(this)
        let myObj = {}
        x.forEach(element => {

            if (typeof this[element] != "function" && typeof this[element] != "object")
                myObj[element] = this[element]
            else if (FireStoreDocument.validate(this[element])) {
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

        if(this["__name"] != undefined){
            return this["__name"];
        }else{
            return this.toString().split('(' || /s+/)[0].split(' ' || /s+/)[1];
        }

    }

    className(): string {
        return this.constructor.name;
    }

    static get(fireStore: AngularFirestore, id): Observable<any> {

        return new Observable(observer => {
            console.log(this.className())
            let document: any = fireStore.doc<any>(this.className() + "/" + id);

            document.snapshotChanges().subscribe(result => {
                try {
                    let document = FireStoreDocument.create(result);
                    if( document != null){
                        let documentMapper = new DocumentMapper(document, this, fireStore);
                        documentMapper.toDocument().subscribe(resultado=>{
                            observer.next(resultado);
                            observer.complete();
                        });
                        
                    }
                } catch (e) {
                    observer.error(new Error(e.message));
                } finally {

                }
            });


        });
    }

    // dynamicOrStatic especifica se o carregamento dos relacionamentos será dinâmico (quando for usado) ou se é para carregar de imediato
    static getAll(fireStore: AngularFirestore, collectionName?, query?:FireStoreQuery[], orderBy?, dynamicOrStatic?): Observable<any[]> {

        let self;
        if (collectionName == undefined) {
            collectionName = this.className()
            self = this;
        }
        else {
            self = collectionName.constructor
            collectionName = self.className
        }

        return new Observable(observer => {
            let collection = this._generateCollection(fireStore, collectionName, query, orderBy)
            let documentMappers = []
            
            FireStoreQuery.generateMultipleQuery(query, collection.ref).get({ source: "server" }).then(r => {
                r.docs.forEach(document => {
                    let docMapper = new DocumentMapper(FireStoreDocument.create(document), this, fireStore)
                    documentMappers.push(docMapper)
                })
                let asyncDocuments = []
                documentMappers.forEach(documentMapper => {
                    //asyncDocuments.push(this._documentToObject(fireStore, documents, this));
                    asyncDocuments.push(documentMapper.toDocument());
                })

                if (asyncDocuments.length > 0) {
                    forkJoin(asyncDocuments).subscribe(res => {

                        observer.next(res);
                        observer.complete();
                    })
                } else {
                    let x = [];
                    observer.next(x);
                    observer.complete();
                }
            })
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
            Document.deleteAll(this.fireStore, element);
        });*/

        return collection.doc(this.id).delete();
    }


    static _generateCollection(fireStore: AngularFirestore, collectionName?, query?, orderBy?): AngularFirestoreCollection<any> {

        if (collectionName == undefined)
            collectionName = this.className()

        function checkOrderBy() {
            if (orderBy != undefined && typeof orderBy == "string")
                return true;
            return false;
        }

        let collection: AngularFirestoreCollection<any> = null;

        
        //console.log(fireStore.firestore.);

        /*if (query != undefined && Array.isArray(query) && query.length > 0) {
            if (query.length == 2 && Array.isArray(query[0]) && Array.isArray(query[1])) {
                if (checkOrderBy())
                    collection = fireStore.collection<any>(collectionName, ref =>
                        ref.where(query[0][0], query[0][1], query[0][2]).
                            where(query[1][0], query[1][1], query[1][2]).orderBy(orderBy))
                else
                    collection = fireStore.collection<any>(collectionName, ref =>
                        ref.where(query[0][0], query[0][1], query[0][2]).
                            where(query[1][0], query[1][1], query[1][2]));
            } else {
                if (checkOrderBy())
                    collection = fireStore.collection<any>(collectionName, ref => ref.where(query[0], query[1], query[2]).orderBy(orderBy));
                else
                    collection = fireStore.collection<any>(collectionName, ref => ref.where(query[0], query[1], query[2]));
            }
        } else {
            if (checkOrderBy())
                collection = fireStore.collection<any>(collectionName, ref => ref.orderBy(orderBy));
            else
                collection = fireStore.collection<any>(collectionName);
        }*/

        collection = fireStore.collection<any>(collectionName);

        return collection;
    }

    /**
         * Returns the size of document's inside a collection.
         */
    static count(fireStore: AngularFirestore, collectionName?, query?:FireStoreQuery[]): Observable<number> {

        return new Observable<number>(observer => {

            this.getAll(fireStore, collectionName, query).subscribe(resultado => {

                observer.next(resultado.length);
                observer.complete();
            })
        });
    }

    /**
     * Returns all documents which belongs to the document.
     */
    relationships() {
        let x = Reflect.ownKeys(this)

        let myObj: any[] = []

        for (let key in x) {

            if (FireStoreDocument.validate(this[x[key]])) {

                myObj[this[x[key]].className()] = this[x[key]];

            }
        }
        return myObj
    }

    getManyToOne() {
        let relationships: any[] = [];
        if (this["_manyToOne"] != undefined && Array.isArray(this["_manyToOne"])) {
            let relations = Reflect.ownKeys(this["_manyToOne"]);
            for (let relation in relations) {
                let z = this["_manyToOne"][relations[relation]]["property"]
                let x = this[z];
                if (this["_manyToOne"][relations[relation]]["property"] != undefined &&
                    Array.isArray(this[this["_manyToOne"][relations[relation]]["property"]])) {
                    for (let i = 0; i < this[this["_manyToOne"][relations[relation]]["property"]].length; i++) {

                        if (FireStoreDocument.validate(this[this["_manyToOne"][relations[relation]]["property"]][i])) {
                            relationships.push(this[this["_manyToOne"][relations[relation]]["property"]][i]);
                        }
                    }
                }
            }
            /*this[this["_manyToOne"][relations[relation]]["property"]].isObject())
             relationships[relation["property"]] = this["_manyToOne"][relation["property"]];
         
         }*/

        }

        return relationships;
    }

    saveRelationship(relationship, relationshipName){
        return new Observable(observer=>{
            // pegar todos one to one
            
            let asyncRequests = []
            // percorrer
            if(relationship != undefined && Array.isArray(relationship)){
                
                for(let relation in relationship){
                    let property = this[relationshipName][relation]["property"]
                    let document = this[property]

                    if(document != undefined)
                        asyncRequests.push(document.add());
                };
                
            }

            if(asyncRequests.length > 0 ){
                forkJoin(asyncRequests).subscribe(resultado=>{
                    for(let i = 0; i < resultado.length; i++){
                        observer.next(true);
                        observer.complete();
                    }
                },
                err=>{
                    // TODO: garantir que add irá disparar um erro em caso de problema.
                    // TODO: fazer um rollback de todas as transações
                    observer.error(new Error());
                })
            }else{
                observer.next(true);
                observer.complete();
            }

            

        })
    }

    saveOneToOne(): Observable<any> {
        let oneToOne = OneToOneRelationship.getFrom(this);
        return this.saveRelationship(oneToOne, OneToOneRelationship._name);
    }

    saveManyToOne(): Observable<any> {
        let manyToOne = ManyToOneRelationship.getFrom(this);
        return this.saveRelationship(manyToOne, ManyToOneRelationship._name);
    }

    



    // Este parâmetro apenas é passado quando utiliza-se decorator @manyToOne, pois esses objetos (vinculados ao manyToOne) não possuem um AngularFireStore.
    add(fireStore?: AngularFirestore): Observable<any> {
        //let inspector = ReflectiveInjector.resolveAndCreate([AngularFirestore]) 
        //let firestore:AngularFirestore = inspector.get(AngularFirestore);
        if (fireStore == undefined)
            fireStore = this.fireStore;

        this.preAdd();

        let collection: AngularFirestoreCollection<any> = fireStore.collection<any>(this.className());
        let ___this = this; // this is lost in promise.
        return new Observable(observer=> {
            
            forkJoin(this.saveOneToOne(), this.saveManyToOne()).subscribe(resultado=>{
                collection.add(___this.toObject()).then(result => {
                    ___this.id = result.id;
                    // save manyToOne
                    observer.next(___this);
                    observer.complete();
                    
                    /*let savingManyToOneRelationships = ___this.saveManyToOne(); // saving oneToMany
                    if (savingManyToOneRelationships != null)
                        savingManyToOneRelationships.then(result => {
                            observer.next(___this);
                            observer.complete();
                        });
                    else{
                        observer.next(___this);
                        observer.complete();
                    }*/
                });
            })
            
            /*let savingRelationships = ___this.saveRelationships();
            savingRelationships.subscribe(result => {
                
                observer.next();
                observer.complete();

            });*/

        });
    }

    update(): Observable<any> {
        
        if(this.id == null){
            this.add();
        }else{
            let ___this = this; // this is lost in promise.
        
            return new Observable(observer => {
                console.log("vai updatar")
                console.log(___this.toObject());
                console.log(___this.className());   
                ___this.fireStore.doc(___this.className() + "/" + ___this.id).update(___this.toObject()).then(result => {
                    
                    observer.next();
                    observer.complete();

                });

            });
        }
        
    }
}
