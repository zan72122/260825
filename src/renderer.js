'use strict';
class Renderer {
  constructor(canvas){
    this.canvas=canvas;
    this.gl=canvas.getContext('webgl2',{antialias:true,alpha:false,powerPreference:'high-performance'});
    if(!this.gl)throw new Error('この端末ではWebGL 2を開始できません。');
    this.program=this.makeProgram(VERTEX_SHADER,FRAGMENT_SHADER);
    this.particleProgram=this.makeProgram(PARTICLE_VERTEX,PARTICLE_FRAGMENT);
    this.geometries=new Map();
    this.scene=null;
    this.particleBuffer=null;
    this.particleVAO=this.gl.createVertexArray();
    this.lastW=0;this.lastH=0;
    const gl=this.gl;
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);
  }
  makeProgram(vsSource,fsSource){
    const gl=this.gl;
    const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));return shader};
    const p=gl.createProgram();gl.attachShader(p,compile(gl.VERTEX_SHADER,vsSource));gl.attachShader(p,compile(gl.FRAGMENT_SHADER,fsSource));gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
    return p;
  }
  upload(name,data){
    if(this.geometries.has(name))return this.geometries.get(name);
    const gl=this.gl,vao=gl.createVertexArray();gl.bindVertexArray(vao);
    const bind=(loc,size,array)=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,array,gl.STATIC_DRAW);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0)};
    bind(0,3,data.vertices);bind(1,3,data.normals);bind(2,2,data.uvs);
    const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,data.indices,gl.STATIC_DRAW);
    const g={vao,count:data.indices.length};this.geometries.set(name,g);gl.bindVertexArray(null);return g;
  }
  getGeometry(name){
    if(this.geometries.has(name))return this.geometries.get(name);
    let data;
    if(name==='box')data=makeBox();
    else if(name==='plane')data=makePlane();
    else if(name==='cylinder')data=makeCylinder();
    else if(name==='sphere')data=makeSphere();
    else if(name==='torus')data=makeTorus();
    else if(name==='bowl')data=makeLathe(BOWL_PROFILE);
    else if(name==='bowl270')data=makeLathe(BOWL_PROFILE,64,Math.PI*1.5);
    else if(name==='plate')data=makeLathe(SHALLOW_PROFILE);
    else throw new Error(`Unknown geometry: ${name}`);
    return this.upload(name,data);
  }
  setScene(scene){
    this.scene=scene;
    if(this.particleBuffer)this.gl.deleteBuffer(this.particleBuffer);
    this.particleBuffer=null;
    if(scene.particles?.points?.length){
      const packed=[];
      scene.particles.points.forEach((p,i)=>packed.push(p[0],p[1],p[2],((i*47)%101)/101));
      const gl=this.gl;this.particleBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.particleBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(packed),gl.STATIC_DRAW);
      this.particleCount=scene.particles.points.length;
    }
  }
  resize(){
    const dpr=Math.min(window.devicePixelRatio||1,1.65),w=Math.max(1,Math.floor(this.canvas.clientWidth*dpr)),h=Math.max(1,Math.floor(this.canvas.clientHeight*dpr));
    if(w!==this.lastW||h!==this.lastH){this.canvas.width=w;this.canvas.height=h;this.lastW=w;this.lastH=h;this.gl.viewport(0,0,w,h)}
  }
  render(time,state){
    if(!this.scene)return;
    this.resize();
    const gl=this.gl,s=this.scene,aspect=this.canvas.width/this.canvas.height;
    gl.clearColor(...s.clear,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const yaw=state.cameraYaw,pitch=state.cameraPitch,base=s.camera.eye,target=s.camera.target;
    const dx=base[0]-target[0],dy=base[1]-target[1],dz=base[2]-target[2],dist=Math.hypot(dx,dz);
    const angle=Math.atan2(dx,dz)+yaw;
    const eye=[target[0]+Math.sin(angle)*dist,target[1]+dy+pitch*dist*.35,target[2]+Math.cos(angle)*dist];
    const view=m4LookAt(m4(),eye,target),proj=m4();
    if(s.camera.ortho){const size=s.camera.ortho*(aspect<1?1.28:1);m4Ortho(proj,-size*aspect,size*aspect,-size,size,.1,80)}
    else m4Perspective(proj,rad(s.camera.fov||42),aspect,.08,100);
    const viewProj=m4Multiply(m4(),proj,view);
    gl.useProgram(this.program);
    const U=(name)=>gl.getUniformLocation(this.program,name);
    gl.uniformMatrix4fv(U('uViewProj'),false,viewProj);gl.uniform3fv(U('uCameraPos'),eye);gl.uniform3fv(U('uAmbient'),s.ambient);
    const lightPos=new Float32Array(16),lightColor=new Float32Array(12),lightPower=new Float32Array(4);
    s.lights.slice(0,4).forEach((l,i)=>{lightPos.set([...l.position,l.directional?0:1],i*4);lightColor.set(l.color,i*3);lightPower[i]=l.power});
    gl.uniform4fv(U('uLightPos[0]'),lightPos);gl.uniform3fv(U('uLightColor[0]'),lightColor);gl.uniform1fv(U('uLightPower[0]'),lightPower);gl.uniform1i(U('uLightCount'),Math.min(4,s.lights.length));
    gl.uniform3fv(U('uFogColor'),s.fog.color);gl.uniform1f(U('uFogNear'),s.fog.near);gl.uniform1f(U('uFogFar'),s.fog.far);gl.uniform1f(U('uPosterize'),s.posterize||0);gl.uniform1f(U('uTime'),time);
    for(const object of s.objects){
      const animPos=[...object.position],animRot=[...object.rotation];
      if(object.anim==='spin')animRot[1]+=time*.18;
      if(object.anim==='slow-spin')animRot[1]+=time*.06;
      if(object.anim==='bob')animPos[1]+=Math.sin(time*.7+object.seed)*.035;
      if(object.anim==='pendulum')animRot[2]+=Math.sin(time*.5+object.seed)*.035;
      const model=m4Compose(animPos,animRot,object.scale),normal=normalFromM4(model),mat=object.material,g=this.getGeometry(object.geometry);
      gl.uniformMatrix4fv(U('uModel'),false,model);gl.uniformMatrix3fv(U('uNormalMatrix'),false,normal);
      gl.uniform3fv(U('uBaseColor'),mat.color);gl.uniform1f(U('uRoughness'),mat.roughness);gl.uniform1f(U('uMetalness'),mat.metalness);
      gl.uniform1f(U('uClearcoat'),mat.clearcoat);gl.uniform1f(U('uOpacity'),mat.opacity);gl.uniform1f(U('uPatternScale'),mat.scale||1);gl.uniform1i(U('uKind'),mat.kind||0);
      if(mat.opacity<1){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false)}else{gl.disable(gl.BLEND);gl.depthMask(true)}
      gl.bindVertexArray(g.vao);gl.drawElements(gl.TRIANGLES,g.count,gl.UNSIGNED_INT,0);
    }
    gl.depthMask(true);gl.disable(gl.BLEND);
    if(this.particleBuffer&&s.particles){
      gl.useProgram(this.particleProgram);
      const P=(name)=>gl.getUniformLocation(this.particleProgram,name);
      gl.uniformMatrix4fv(P('uViewProj'),false,viewProj);gl.uniform1f(P('uTime'),time);gl.uniform1i(P('uMode'),s.particles.mode);gl.uniform1f(P('uSize'),s.particles.size);
      gl.uniform3fv(P('uColorA'),s.particles.colorA);gl.uniform3fv(P('uColorB'),s.particles.colorB);
      gl.bindVertexArray(this.particleVAO);gl.bindBuffer(gl.ARRAY_BUFFER,this.particleBuffer);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,16,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,1,gl.FLOAT,false,16,12);
      gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.drawArrays(gl.POINTS,0,this.particleCount);gl.depthMask(true);gl.disable(gl.BLEND);gl.bindVertexArray(null);
    }
  }
}
