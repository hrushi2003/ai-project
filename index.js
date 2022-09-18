const carCanvas = document.getElementById("carCanvas");
const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width =300;
carCanvas.width = 200;
class Controls{
    constructor(controlType){
        this.forward = false;
        this.left = false;
        this.right = false;
        this.backward = false;
        switch(controlType){
          case "KEYS":
            this.#addKeyboardListeners();
          break;
          case "DUMMY":
            this.forward = true
            break; 
        }
    }
    #addKeyboardListeners(){
        document.onkeydown = (event) => {
            switch(event.key){
                case "ArrowLeft":
                  this.left = true;
                  break;
                case "ArrowRight":
                  this.right = true;
                  break;
                case "ArrowUp":
                  this.forward = true;
                  break;
                case "ArrowDown":
                    this.backward = true;
                    break;           
            }
            console.table(this)
        }
        document.onkeyup = (event) => {
            switch(event.key){
                case "ArrowLeft":
                  this.left = false;
                  break;
                case "ArrowRight":
                  this.right = false;
                  break;
                case "ArrowUp":
                  this.forward = false;
                  break;
                case "ArrowDown":
                    this.backward = false;
                    break;           
            }
            console.table(this)
        }
    }
}
class Car{
    constructor(x,y,width,height,controlType,maxSpeed=3){
     this.x = x;
     this.y = y;
     this.width = width;
     this.height=height;

     this.speed = 0;
     this.acceleration = 0.2;
     this.maxSpeed = maxSpeed;
     this.friction = 0.05;
     this.angle = 0;
     if(controlType!="DUMMY"){
     this.sensor=new Sensors(this);
     this.brain = new NeuralNetwork(
       [this.sensor.rayCount,6,4]
     );
    };
     this.controls = new Controls(controlType);
     this.damaged=false;

     this.useBrain = controlType=="AI";
    }
    update(roadBorders,traffic){
      if(!this.damaged){
      if(this.controls.forward){
        this.speed += this.acceleration;
      }
      if(this.controls.backward){
        this.speed -= this.acceleration;
      }
      if(this.speed > this.maxSpeed){
        this.speed = this.maxSpeed;
      }
      if(this.speed <- this.maxSpeed/2){
        this.speed =-this.maxSpeed/2;
      }
      if(this.speed >0){
        this.speed -= this.friction;
      }
      if(this.speed <0){
        this.speed += this.friction;
      }
      if(Math.abs(this.speed) < this.friction){
        this.speed = 0;
      }
       if(this.speed!==0){
         const flip = this.speed > 0? 1:-1;
      if(this.controls.left){
        this.angle += 0.03*flip;
      }
      if(this.controls.right){
        this.angle -= 0.03*flip;
      }}
      this.x -= Math.sin(this.angle)*this.speed
      this.y -= Math.cos(this.angle)*this.speed;
      this.polygon = this.createPolygon();
      this.damaged = this.accessDamage(roadBorders,traffic)};
      if(this.sensor){
      this.sensor.update(roadBorders,traffic);
      const offsets = this.sensor.readings.map(
        s=>s==null?0:1-s.offset
      );
      const outputs = NeuralNetwork.feedForward(offsets,this.brain);
      if(this.useBrain){
        this.controls.forward = outputs[0];
        this.controls.left    = outputs[1];
        this.controls.right   = outputs[2];
        this.controls.backward= outputs[3];
      }
    };
    }
    accessDamage(roadBorders,traffic){
        for(let i=0; i < roadBorders.length;i++){
           if(polysIntersect(this.polygon,roadBorders[i])){
             return true
           }
        }
        for(let i=0; i < traffic.length;i++){
          if(polysIntersect(this.polygon,traffic[i].polygon)){
            return true
          }
       }
       return false;
    }
    createPolygon(){
      const points = [];
      const rad = Math.hypot(this.width,this.height)/2;
      const alpha = Math.atan2(this.width,this.height);
      points.push(
        {
          x:this.x - Math.sin(this.angle-alpha)*rad,
          y:this.y - Math.cos(this.angle-alpha)*rad
        }
      );
      points.push(
        {
          x:this.x - Math.sin(this.angle+alpha)*rad,
          y:this.y - Math.cos(this.angle+alpha)*rad
        }
      );
      points.push(
        {
          x:this.x - Math.sin(Math.PI+this.angle-alpha)*rad,
          y:this.y - Math.cos(Math.PI+this.angle-alpha)*rad
        }
      );
      points.push(
        {
          x:this.x - Math.sin(Math.PI+this.angle+alpha)*rad,
          y:this.y - Math.cos(Math.PI+this.angle+alpha)*rad
        }
      );
      return points;

    }
    draw(ctx,color,drawSensor=false){
      if(this.damaged){
        ctx.fillStyle="gray";
      }
      else{
        ctx.fillStyle=color;
      }
       ctx.beginPath();
       ctx.moveTo(this,this.polygon[0].x,this.polygon[0].y);
       for(let i = 0; i < this.polygon.length;i++){
         ctx.lineTo(this.polygon[i].x,this.polygon[i].y)};
         ctx.fill();
         if(this.sensor && drawSensor){
        this.sensor.draw(ctx);
         };
    }
}
class Road {
  constructor(x,width,laneCount=3){
    this.x = x;
    this.width = width;
    this.laneCount = laneCount;

    this.left = x-width/2;
    this.right = x+width/2;

    const infinity = 10000000;
    this.top = -infinity;
    this.bottom = infinity;

    const topLeft = {x:this.left,y:this.top};
    const topRight = {x:this.right,y:this.top};
    const bottomLeft = {x:this.left,y:this.bottom};
    const bottomRight = {x:this.right,y:this.bottom};
    
    this.borders = [
      [topLeft,bottomLeft],
      [topRight,bottomRight]
    ]

  }
   getLaneCenter(laneIndex){
     const laneWidth = this.width/this.laneCount;
     return this.left + laneWidth/2+Math.min(laneIndex,this.laneCount-1)*laneWidth;
   }

  draw(ctx){
    ctx.lineWidth = 5;
    ctx.strokeStyle = "white";

    for(let i = 1; i <= this.laneCount-1; i++){
      const x= lerp(
        this.left,
        this.right,
        i/this.laneCount
      )
      ctx.setLineDash([25,25]);
      ctx.beginPath();
      ctx.moveTo(x,this.top);
      ctx.lineTo(x,this.bottom);
      ctx.stroke();}
      ctx.setLineDash([])
    
    this.borders.forEach(border => {
      ctx.beginPath();
      ctx.moveTo(border[0].x,border[0].y);
      ctx.lineTo(border[1].x,border[1].y);
      ctx.stroke();
    })
  }
}
const lerp = (A,B,t) => {
  return A+(B-A)*t;
}
const polysIntersect=(poly1,poly2) =>{
   for(let i = 0; i <poly1.length; i++){
     for(let j = 0; j < poly2.length; j++){
       const touch = getInterSection(
         poly1[i],
         poly1[(i+1)%poly1.length],
         poly2[j],
         poly2[(j+1)%poly2.length]
       );
       if(touch){
         return true;
       }
     }
   }
   return false;
}
const getInterSection =(A,B,C,D) => {
  const tTop =(D.x-C.x)*(A.y-C.y)-(D.y-C.y)*(A.x-C.x);
  const uTop =(C.y-A.y)*(A.x-B.x)-(C.x-A.x)*(A.y-B.y);
  const Bottom = (D.y-C.y)*(B.x-A.x)-(D.x-C.x)*(B.y-A.y);
  if(Bottom!=0){
  const t= tTop/Bottom;
  const u = uTop/Bottom;
  if(t>=0 && t<=1 && u>=0 && u<=1){
  return{
      x:lerp(A.x,B.x,t),
      y:lerp(A.y,B.y,t),
      offset:t
  }}
}
return null;
}

const getRGBA = (value) => {
       const alpha = Math.abs(value);
       const R = value <0?0:255;
       const G=R;
       const B =value > 0?0:255;
       return "rgba("+R+","+G+","+B+","+alpha+")";
}


class Sensors{
  constructor(car) {
    this.car = car;
    this.rayCount = 5;
    this.rayLength =150;
    this.raySpread= Math.PI/2;
    this.rays= [];
    this.readings = [];
  }
  update(roadBorders,traffic){
    this.rays = [];
    for(let i = 0; i< this.rayCount;i++){
      const rayAngle= lerp(
        this.raySpread/2,
        -this.raySpread/2,
        this.rayCount===1?0.5:i/(this.rayCount-1)
      )+this.car.angle;
      const start = {x:this.car.x,y:this.car.y};
      const end = {x:this.car.x - Math.sin(rayAngle)*this.rayLength,y:this.car.y-Math.cos(rayAngle)*this.rayLength};
      this.rays.push([start,end]); 
  }
  this.readings = [];
  for(let i = 0; i < this.rays.length;i++){
    this.readings.push(this.getReading(this.rays[i],roadBorders,traffic));
  }
    }
    getReading(ray,roadBorders,traffic){
      let touches = [];
      let roadendings=[[{x: 10, y: -10000000},{x: 10, y: 10000000}],[{x: 190, y: -10000000},{x: 190, y: 10000000}]];
      let length = roadendings.length;
      for(let i =0; i < roadBorders.length; i++){
        const touch = getInterSection(
          ray[0],
          ray[1],
          roadBorders[i][0],
          roadBorders[i][1]
        );
        if(touch){
          touches.push(touch);
        }
      }
      for(let i = 0; i < traffic.length; i++){
        const poly = traffic[i].polygon;
        for(let j = 0; j < poly.length; j++){
          const value = getInterSection(
                  ray[0],
                  ray[1],
                  poly[j],
                  poly[(j+1)%poly.length]
          );
          if(value){
            touches.push(value);
          }
        }
      }
      if(touches.length == 0){
        return null;
      }else{
        const offsets = touches.map(e=>e.offset);
        const minOffset = Math.min(...offsets);
        return touches.find(e=>e.offset==minOffset);
      }
    }
      
  draw(ctx){
    for(let i = 0; i < this.rayCount;i++){
      let end = this.rays[i][1];
      if(this.readings[i]){
        end = this.readings[i];
      }
      ctx.beginPath();
      ctx.strokeStyle="yellow";
      ctx.lineWidth =2;
      ctx.moveTo(this.rays[i][0].x,this.rays[i][0].y);
      ctx.lineTo(end.x,end.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle="black";
      ctx.lineWidth =2;
      ctx.moveTo(this.rays[i][1].x,this.rays[i][1].y);
      ctx.lineTo(end.x,end.y);
      ctx.stroke();
    }
  }
}


class NeuralNetwork{
  constructor(neuronCount){
    this.levels = [];
    for(let i = 0; i < neuronCount.length-1;i++){
      this.levels.push(new level(neuronCount[i],neuronCount[i+1]))
    }
  }
  static feedForward(givenInputs,network){
     let outputs = level.feedForward(givenInputs,network.levels[0]);
     for(let i = 1; i < network.levels.length; i++){
       outputs = level.feedForward(
         outputs,network.levels[i]
       )
     }
     return outputs;
  }
  static mutate(network,amount=1){
    network.levels.forEach(level => {
      for(let i = 0; i < level.baises.length; i++){
        level.baises[i] =lerp(
          level.baises[i],
          Math.random()*2-1,
          amount
        );
      }
      for(let i = 0; i < level.weights.length; i++){
        for(let j = 0; j < level.weights[i].length; j++){
          level.weights[i][j] =lerp(
            level.weights[i][j],
            Math.random()*2-1,
            amount
          )
        }
      }
    });
  }
}


class level{
  constructor(inputCount,outputCount){
    this.inputs  = new Array(inputCount);
    this.outputs = new Array(outputCount);
    this.baises = new Array(outputCount);

    this.weights = [];
    for(let i = 0; i < inputCount; i++){
      this.weights[i] = new Array(outputCount);
    }

    level.randomize(this);
  }
  static randomize(level){
    for(let i = 0; i < level.inputs.length; i++){
      for(let j = 0; j < level.outputs.length; j++){
        level.weights[i][j] = Math.random()*2-1;
      }
    }

    for(let i = 0; i < level.baises.length; i++){
      level.baises[i] = Math.random()*2-1;
    }
  }
  static feedForward(givenInputs,level){
    for(let i = 0; i < level.inputs.length; i++){
      level.inputs[i] = givenInputs[i];
    }
    for(let i = 0; i < level.outputs.length; i++){
      let sum = 0;
      for(let j = 0; j < level.inputs.length; j++){
        sum += level.inputs[j]*level.weights[j][i];
      }
      if(sum > level.baises[i]){
        level.outputs[i] = 1;
      }
      else{
        level.outputs[i] = 0;
      }

    }
    return level.outputs;
  }
}


class Visualiser{
  static drawNetwork(ctx,network){
    const margin = 50;
    const left = margin;
    const top = margin;
    const width =ctx.canvas.width-margin*2;
    const height= ctx.canvas.height-margin*2;

    const levelHeight=height/network.levels.length;

    for(let i = network.levels.length-1; i >=0; i--){
      const levelTop = top+ lerp(
        height-levelHeight,
        0,
       network.levels.length==1?0.5:i/(network.levels.length-1)
      );

      Visualiser.drawLevel(ctx,network.levels[i],left,levelTop,width,levelHeight,
        i==network.levels.length-1?["Up","left","right","Down"]:[]);
    }
    
  }
  static drawLevel(ctx,level,left,top,width,height,outputLabels){
     const right = left + width;
     const bottom = top+height;

     const {inputs,outputs,weights,baises} = level;

     for(let i = 0; i < inputs.length; i++){
      for(let j = 0; j < outputs.length; j++){
        ctx.beginPath();
       ctx.moveTo(
         Visualiser.getNodeX(inputs,i,left,right),
         bottom
       );
       ctx.lineTo(
         Visualiser.getNodeX(outputs,j,left,right),
         top
       );
       ctx.lineWidth=2;
       ctx.strokeStyle=getRGBA(weights[i][j])
       ctx.stroke();
       
      }
    }

     const nodeRadius = 10;
     for(let i = 0; i < inputs.length; i++){
        const x =Visualiser.getNodeX(inputs,i,left,right);
        ctx.beginPath();
        ctx.arc(x,bottom,nodeRadius,0,Math.PI*2);
        ctx.fillStyle="black";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x,bottom,nodeRadius*0.6,0,Math.PI*2);
        ctx.fillStyle=getRGBA(inputs[i]);
        ctx.fill();

     }
       
     for(let i = 0; i < outputs.length; i++){
      const x =Visualiser.getNodeX(outputs,i,left,right);
      ctx.beginPath();
      ctx.arc(x,top,nodeRadius,0,Math.PI*2);
      ctx.fillStyle="black";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x,top,nodeRadius*0.6,0,Math.PI*2);
      ctx.fillStyle=getRGBA(outputs[i]);
      ctx.fill();

      ctx.beginPath();
        ctx.lineWidth =2;
        ctx.arc(x,top,nodeRadius*0.8,0,Math.PI*2);
        ctx.strokeStyle=getRGBA(baises[i]);
        ctx.setLineDash([3,3])
        ctx.stroke();
        ctx.setLineDash([]);

        if(outputLabels[i]){
          ctx.beginPath();
          ctx.textAlign="center";
          ctx.textBaseline="middle";
          ctx.fillStyle="black";
          ctx.strokeStyle="white";
          ctx.font=(nodeRadius*1.5)+"px Arial";
          ctx.fillText(outputLabels[i],x,top);
          ctx.lineWidth=0.5;
          ctx.strokeText(outputLabels[i],x,top);

        }
   }

  }
  static getNodeX(nodes,index,left,right){
    return lerp(
      left,
      right,
      nodes.length==1?0.5:index/(nodes.length-1)
    )
  }
}




const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");
const road = new Road(carCanvas.width/2,carCanvas.width*0.9);
const N = 1;
const cars = generateCars(N);
let bestCar =cars[0];
if(localStorage.getItem("bestBrain")){
  for(let i = 0; i < cars.length; i++){
  cars[i].brain=JSON.parse(localStorage.getItem("bestBrain"));

  if(i!=0){
    NeuralNetwork.mutate(cars[i].brain,0.12);
  }
  }new Car(road.getLaneCenter(1),-1430,30,50,"DUMMY",2)
}
const traffic =[
  new Car(road.getLaneCenter(1),-100,30,50,"DUMMY",2),
  new Car(road.getLaneCenter(2),-300,30,50,"DUMMY",2),
  new Car(road.getLaneCenter(0),-300,30,50,"DUMMY",2),
  new Car(road.getLaneCenter(0),-300,30,50,"DUMMY",2),
  new Car(road.getLaneCenter(0),-500,30,50,"DUMMY",2),
  new Car(road.getLaneCenter(1),-500,30,50,"DUMMY",2),
  new Car(road.getLaneCenter(1),-700,30,50,"DUMMY",2),
  new Car(road.getLaneCenter(2),-700,30,50,"DUMMY",2),
  new Car(road.getLaneCenter(2),-1000,30,50,"DUMMY",2),
  new Car(road.getLaneCenter(1),-1000,30,50,"DUMMY",2),
  new Car(road.getLaneCenter(0),-1150,30,50,"DUMMY",2),
  new Car(road.getLaneCenter(2),-1150,30,50,"DUMMY",2),
  new Car(road.getLaneCenter(1),-1300,30,50,"DUMMY",2),
  new Car(road.getLaneCenter(1),-1430,30,50,"DUMMY",2),
  new Car(road.getLaneCenter(1),-1530,30,50,"DUMMY",2),
  new Car(road.getLaneCenter(0),-1530,30,50,"DUMMY",2),
  new Car(road.getLaneCenter(2),-1680,30,50,"DUMMY",2),
  new Car(road.getLaneCenter(0),-1680,30,50,"DUMMY",2)
];

function generateCars(N){
  const cars= [];
  for(let i = 0; i<=N;i++){
    cars.push(new Car(road.getLaneCenter(1),100,30,50,"AI"))
  }
  return cars;
}

const animate = () => {
  for(let i = 0; i < traffic.length; i++){
    traffic[i].update(road.borders,[]);
  }
  for(let i = 0; i < cars.length; i++){
  cars[i].update(road.borders,traffic);
  }

  bestCar= cars.find(
    c=>c.y==Math.min(...cars.map(c=>c.y))
  );
  
  carCanvas.height = window.innerHeight;
  networkCanvas.height=window.innerHeight;
  carCtx.save();
  carCtx.translate(0,-bestCar.y+carCanvas.height*0.7);
  road.draw(carCtx);
  for(let i = 0; i < traffic.length; i++){
    traffic[i].draw(carCtx,"red");
  }
  carCtx.globalAlpha=0.2;
  for(let i = 0; i < cars.length; i++){
  cars[i].draw(carCtx,"blue");
  }
  carCtx.globalAlpha=1;
  bestCar.draw(carCtx,"blue",true);

  carCtx.restore();

  Visualiser.drawNetwork(networkCtx,bestCar.brain)
  requestAnimationFrame(animate);
}
animate();

function save(){
  localStorage.setItem("bestBrain",
  JSON.stringify(bestCar.brain))
  };

  function discard(){  
    localStorage.removeItem("bestBrain");
  }