import { Observable, forkJoin } from 'rxjs';
import { FireStoreQuery } from './query';
import { Relationship } from './relationship';
import { RelationshipFactory } from './relationshipFactory';
export class FireStoreDocument {

    id;
    data;

    protected constructor(id, data) {
        this.id = id;
        this.data = data
    }

    static create(document){
        if( this.validate(document) ){
            let id;
            let data;
            
            if(document.payload != undefined){
                if (document.payload.doc == undefined) {
                    data = document.payload.data();
                    id = document.payload.id;
                } else {
    
                    data = document.payload.doc.data();
                    id = document.payload.doc.id;
                }
            }else{
                data = document.data();
                id = document.id;
            }

            

            return new FireStoreDocument(id, data)
        }else{
            return null;
        }
    }

    static validate(document) {
        /*if (typeof document == "object" && document != null && typeof document.toObject == "function")
            return true
        return false*/


        if (document.payload != undefined && document.payload.exists != undefined && document.payload.exists == true && (typeof document.payload.data == "function" || (document.payload.doc != undefined && typeof document.payload.doc.data == "function"))) {
            return true;
        }else if(document.exists != undefined && document.exists == true){
            return true;
        }

        return false;
    }

    static _documentToObject(fireStore, document, classCaller): any {
        return new Observable(observer => {
            let id;
            let data;

            try {
                if ((document.payload.exists != undefined && document.payload.exists == true) ||
                    document.payload.doc != undefined && document.payload.doc.exists == true) {


                    
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
                        let asyncRequests = [];
                        let propertiesName = [];
                        Reflect.ownKeys(data).forEach(element => {
                            propriedades[element] = {
                                value: data[element],
                                writable: true,
                                enumerable: true
                            }

                            /*if (classCaller.prototype._manyToOne != undefined &&
                                classCaller.prototype._manyToOne[element] != undefined) {
    
                                if (classCaller.prototype._manyToOne[element].document != undefined) {
                                    let obje = classCaller.prototype._manyToOne[element].document;
                                    if (typeof obje.constructor.get == "function") {
                                        asyncRequests.push(obje.constructor.get(fireStore, data[element]));
                                        propertiesName.push({ name: classCaller.prototype._manyToOne[element].property, type: "manyToOne" })
                                        
                                    }
    
                                }
                            }
    
                            if (classCaller.prototype._oneToOne != undefined &&
                                classCaller.prototype._oneToOne[element] != undefined) {
                                if (classCaller.prototype._oneToOne[element].document != undefined) {
                                    let obje = classCaller.prototype._oneToOne[element].document;
                                    if (typeof obje.constructor.get == "function") {
                                        asyncRequests.push(obje.constructor.get(fireStore, data[element]));
                                        propertiesName.push({ name: classCaller.prototype._oneToOne[element].property, type: "oneToOne" })
                                        
                                    }
    
                                }
                            }*/



                        });



                        // percorrer todos os oneToMany existentes
                        /*if (classCaller.prototype._oneToMany != undefined) {
                            for (let key in classCaller.prototype._oneToMany) {
                                // jogar aqui
    
                                if (classCaller.prototype._oneToMany[key] != undefined) {
                                    // disparando excep
                                    if (classCaller.prototype._oneToMany[key].document != undefined) {
                                        let obje = classCaller.prototype._oneToMany[key].document;
                                        if (typeof obje.constructor.get == "function") {
                                            asyncRequests.push(obje.constructor.getAll(fireStore, undefined, [classCaller.className(), "==", id]));
                                            propertiesName.push({ name: classCaller.prototype._oneToMany[key].property, type: "oneToMany" })
                                            
                                        }
    
                                    }
                                }
                            }
                        }*/

                        // TODO: Deve retornar um Array
                        if (asyncRequests.length > 0) {
                            forkJoin(
                                asyncRequests
                            ).subscribe(resultados => {
                                let obj = Object.create(this.prototype, propriedades)
                                let i = 0;
                                for (let j = 0; j < resultados.length; j++) {
                                    if (propertiesName[i].type == "oneToOne") {
                                        obj[propertiesName[i].name] = resultados[j];
                                    } else {
                                        obj[propertiesName[i].name] = resultados[j];
                                    }

                                    i++;
                                }

                                observer.next(obj);
                                observer.complete()
                            });
                        } else {
                            observer.next(Object.create(this.prototype, propriedades));
                            observer.complete()
                        }

                    }
                } else {
                    throw new Error("This document doesn't exist.");
                }
            } catch (e) {
                throw new Error(e);
            }
        })

    }

    /*getOneToOneRelationships(element) {
        if (this.metaData.prototype._oneToOne != undefined &&
            this.metaData.prototype._oneToOne[element] != undefined) {
            if (this.metaData.prototype._oneToOne[element].document != undefined) {
                let obje = this.metaData.prototype._oneToOne[element].document;
                if (typeof obje.constructor.get == "function") {
                    return new OneToOneRelationship(this.metaData.prototype._oneToOne[element].property,
                                                    obje.constructor.get(this.fireStore, this.data[element]))
                    

                }

            }
        }

        return null;
    }*/
}