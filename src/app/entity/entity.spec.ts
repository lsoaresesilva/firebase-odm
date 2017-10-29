import { FirebaseApp, FirebaseAppConfig, AngularFireModule} from 'angularfire2';
import { AngularFireDatabase, AngularFireDatabaseModule } from 'angularfire2/database';
import { inject } from '@angular/core/testing';
import { COMMON_CONFIG } from './test-config';
import { AngularFirestore, AngularFirestoreModule } from "angularfire2/firestore";
import { TestBed } from "@angular/core/testing";
import { Entity } from "./entity";
import * as firebase from 'firebase/app';

const RUN_TESTS = false;

if( RUN_TESTS != false ){
describe('Entity tests', () => {
let app: firebase.app.App;
  let afs: AngularFirestore;

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

  afterEach(done => {
    app.delete().then(done, done.fail);
    
  });


    it("should save an instance", done => {
        class Animal extends Entity {
            name: string = null;
        }

        
        
        let animal: Animal = new Animal(afs);
        animal.name = "hipopotamo"
        animal.salvar().then(result => {
            expect(result.id).toBe("");
            done();
        });
    }
    )
})
}