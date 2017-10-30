import { Component } from '@angular/core';
import { AngularFirestore } from "angularfire2/firestore";
import { Entity } from "./entity/entity";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';

  constructor(private firestore:AngularFirestore){
    class Maoeoeoe extends Entity {
            name: string = null;
            h:Hauhau = null;
        }

    class Hauhau extends Entity{
      hau:string = null;
    }
    
    let y = new Hauhau(firestore);
    y.hau = "maaaoe"
    let m = new Maoeoeoe(firestore);
    m.h = y;
    m.name = "Tevez";
    m.add();
    
  }
}
