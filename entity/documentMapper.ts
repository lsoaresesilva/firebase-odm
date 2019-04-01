import { FireStoreQuery } from './query';
import { Observable, forkJoin } from "rxjs";
import { FireStoreDocument } from "./firestoreDocument";
import { RelationshipFactory } from "./relationshipFactory";
import { AngularFirestore } from "@angular/fire/firestore";
import { Relationship } from './relationship';

/**
 * Maps a firestore document into an Entity
 */
export class DocumentMapper {

    constructor(private document: FireStoreDocument, private metaData, private fireStore: AngularFirestore) {

    }

    private relationships() {
        let asyncRequests = []
        let properties = []
        let relationships = RelationshipFactory.getAllFrom(this.metaData, this.fireStore);
        relationships.forEach(relationship => {
            // se onetoone, pegar o ID pelo nome da propriedade

            // se onetoMany, ir nos docs, pegando que tenham Id do document
            
            if(Array.isArray(relationship)){
                relationship.forEach(relation=>{
                    
                    let query: FireStoreQuery = new FireStoreQuery("id", "==", this.document.data[relation.entityName])
                    properties.push(relation.property);
                    asyncRequests.push(relation.query(query))
                })
            }
        })

        return {requests:asyncRequests, properties:properties};
    }

    

    private primitiveData(): any {
        let properties = {}
        properties['id'] = {
            value: this.document.id,
            writable: true,
            enumerable: true
        }
        properties['fireStore'] = {
            value: this.fireStore,
            writable: true,
            enumerable: true
        }
        Reflect.ownKeys(this.document.data).forEach(element => {


            // SE Não for relationship
            if (!Relationship.validate(this.metaData, element)) {
                properties[element] = {
                    value: this.document.data[element],
                    writable: true,
                    enumerable: true
                }
            }
        });

        return properties;
    }


    private extract(): Observable<{}> {
        return new Observable(observer => {
            if (typeof this.document.data == "object") {
                let properties = this.primitiveData()
                let relationships = this.relationships();
                //let obs = OneToOneRelationship.getObservables(asyncRequests)
                if (relationships.requests.length > 0) {
                    forkJoin(
                        relationships.requests
                    ).subscribe(resultados => {
                        for (let j = 0; j < resultados.length; j++) {
                            // pegar o nome da propriedade de metaData que contém o resultado
                            properties[relationships["properties"][j]] = {
                                value: resultados[j],
                                writable: true,
                                enumerable: true
                            }
                        }

                        observer.next(properties);
                        observer.complete()
                    });
                } else {
                    observer.next(properties);
                    observer.complete()
                }

            } else {
                observer.next({})
                observer.complete();
            }

        })

    }

    toDocument(){
        return new Observable(observer=>{
            this.extract().subscribe(propriedades=>{
                
                observer.next(Object.create(this.metaData["prototype"], propriedades));
                observer.complete();
            }) // TODO : e se não entrar no subscribe?
        })
    }

}
/*let relationship = RelationshipFactory.get(this.metaData.prototype, element, this.fireStore);
                if( relationship != undefined){
                    let observable = relationship.query(new FireStoreQuery("id", "==", this.data[element]))
                    properties.push(relationship.getProperty())
                    asyncRequests.push(observable)
                }else{*/