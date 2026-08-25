export class SoundManager{
  constructor(){this.enabled=true;this.ctx=null;this.master=null;this.noiseBuffer=null;}
  ensure(){
    if(!this.enabled)return null;
    if(!this.ctx){
      const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return null;
      this.ctx=new Ctx();this.master=this.ctx.createGain();this.master.gain.value=.22;this.master.connect(this.ctx.destination);
      const length=this.ctx.sampleRate*.45,buffer=this.ctx.createBuffer(1,length,this.ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);this.noiseBuffer=buffer;
    }
    if(this.ctx.state==='suspended')this.ctx.resume();return this.ctx;
  }
  setEnabled(value){this.enabled=Boolean(value);if(this.master)this.master.gain.setTargetAtTime(this.enabled?.22:0,this.ctx.currentTime,.02);}
  toggle(){this.setEnabled(!this.enabled);return this.enabled;}
  tone(freq=440,duration=.12,type='sine',gain=.15,slide=0){
    const ctx=this.ensure();if(!ctx)return;const now=ctx.currentTime,osc=ctx.createOscillator(),amp=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,now);if(slide)osc.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide),now+duration);amp.gain.setValueAtTime(.0001,now);amp.gain.exponentialRampToValueAtTime(gain,now+.012);amp.gain.exponentialRampToValueAtTime(.0001,now+duration);osc.connect(amp);amp.connect(this.master);osc.start(now);osc.stop(now+duration+.03);
  }
  noise(duration=.12,gain=.08,filterFreq=1600){
    const ctx=this.ensure();if(!ctx||!this.noiseBuffer)return;const now=ctx.currentTime,src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),amp=ctx.createGain();src.buffer=this.noiseBuffer;filter.type='bandpass';filter.frequency.value=filterFreq;filter.Q.value=.7;amp.gain.setValueAtTime(gain,now);amp.gain.exponentialRampToValueAtTime(.0001,now+duration);src.connect(filter);filter.connect(amp);amp.connect(this.master);src.start(now);src.stop(now+duration+.02);
  }
  tap(){this.tone(330,.075,'sine',.08,60);this.haptic(8);}
  scrape(){this.noise(.09,.045,900);}
  brush(){this.noise(.08,.028,2100);}
  pour(){this.tone(210,.18,'sine',.055,-50);this.noise(.13,.025,700);}
  gold(){this.tone(760,.12,'triangle',.055,180);}
  step(){this.tone(460,.12,'sine',.08,130);setTimeout(()=>this.tone(650,.13,'sine',.065,90),80);this.haptic([10,30,10]);}
  chapter(){this.tone(330,.22,'triangle',.11,110);setTimeout(()=>this.tone(520,.26,'sine',.09,150),120);this.haptic([12,45,18]);}
  finale(){[262,330,392,523].forEach((f,i)=>setTimeout(()=>this.tone(f,.42,'sine',.085,40),i*125));this.haptic([18,60,18,60,28]);}
  haptic(pattern){try{navigator.vibrate?.(pattern);}catch{}}
}
