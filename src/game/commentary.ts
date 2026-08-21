import { sound } from './audio';

export interface CommentaryMessage {
  id: string;
  text: string;
  speaker: string;
  type: 'start' | 'lead_change' | 'overtake' | 'hazard' | 'checkpoint' | 'finish' | 'elimination' | 'hype';
  timestamp: number;
  countryName?: string;
  flagEmoji?: string;
}

class CommentaryEngine {
  private listeners: ((msg: CommentaryMessage) => void)[] = [];
  private lastCallTime: number = 0;
  private minIntervalMs: number = 2200;
  private speechEnabled: boolean = true;
  private voice: SpeechSynthesisVoice | null = null;
  private isSpeaking: boolean = false;
  private history: CommentaryMessage[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        const voices = window.speechSynthesis.getVoices();
        // Look for energetic English voice
        this.voice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Online'))) || voices[0] || null;
      };
    }
  }

  public subscribe(listener: (msg: CommentaryMessage) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public setSpeechEnabled(enabled: boolean) {
    this.speechEnabled = enabled;
    if (!enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public getSpeechEnabled(): boolean {
    return this.speechEnabled;
  }

  public getHistory(): CommentaryMessage[] {
    return this.history;
  }

  public emit(text: string, type: CommentaryMessage['type'], countryName?: string, flagEmoji?: string, force: boolean = false) {
    const now = Date.now();
    if (!force && now - this.lastCallTime < this.minIntervalMs) {
      return;
    }
    this.lastCallTime = now;

    const message: CommentaryMessage = {
      id: Math.random().toString(36).substring(2, 9),
      text,
      speaker: 'Alex Rivera',
      type,
      timestamp: now,
      countryName,
      flagEmoji,
    };

    this.history.unshift(message);
    if (this.history.length > 50) this.history.pop();

    this.listeners.forEach(cb => cb(message));

    // Optional Speech Synthesis
    if (this.speechEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window && !sound.getIsMuted()) {
      try {
        window.speechSynthesis.cancel(); // Don't queue up a backlog
        const utterance = new SpeechSynthesisUtterance(text);
        if (this.voice) utterance.voice = this.voice;
        utterance.rate = 1.15;
        utterance.pitch = 1.05;
        utterance.volume = 0.8;
        window.speechSynthesis.speak(utterance);
      } catch (e) {}
    }
  }

  // --- Specific Event Triggers ---

  public onRaceStart(levelNumber: number, roundName: string, racersCount: number) {
    const startPhrases = [
      "AND THEY'RE OFF! The marble racers surge forward!",
      "GREEN LIGHT! Look at the explosive launch from the pack!",
      "The starting gates drop and the championship sprint begins!",
      "Off to the races! High speed right out of the gate!",
      "Here we go! Total speed and adrenaline on the elevated circuit!",
    ];
    const phrase = startPhrases[Math.floor(Math.random() * startPhrases.length)];
    this.emit(phrase, 'start', undefined, undefined, true);
    sound.playCrowdCheer(0.6);
  }

  public onLeadChange(leaderName: string, leaderFlag: string, previousLeaderName?: string) {
    const phrases = [
      `${leaderFlag} ${leaderName} storms into first place!`,
      `Sensational maneuver! ${leaderFlag} ${leaderName} claims the lead!`,
      `Look at ${leaderFlag} ${leaderName} finding the turbo line to take P1!`,
      `${leaderFlag} ${leaderName} muscles ahead of the field!`,
      `New race leader! ${leaderFlag} ${leaderName} breaks out in front!`,
    ];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    this.emit(phrase, 'lead_change', leaderName, leaderFlag);
    sound.playOvertake();
  }

  public onOvertake(overtakingCountry: string, overtakenCountry: string, overtakingFlag: string) {
    const phrases = [
      `${overtakingFlag} ${overtakingCountry} makes an incredible dive on the inside of ${overtakenCountry}!`,
      `Wheel-to-wheel drama! ${overtakingFlag} ${overtakingCountry} slips past ${overtakenCountry}!`,
      `${overtakingFlag} ${overtakingCountry} takes the slipstream and surges ahead of ${overtakenCountry}!`,
      `Clean pass from ${overtakingFlag} ${overtakingCountry} as they move up the order!`,
    ];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    this.emit(phrase, 'overtake', overtakingCountry, overtakingFlag);
    sound.playOvertake();
  }

  public onHazardKnockoff(countryName: string, flag: string, hazardName: string) {
    const phrases = [
      `OH NO! ${flag} ${countryName} caught by the ${hazardName} and takes a tumble!`,
      `Disaster for ${flag} ${countryName}! Pushed off the elevated track!`,
      `Massive collision! ${flag} ${countryName} spins out and respawns at the checkpoint!`,
      `What a punishing hit from the ${hazardName} on ${flag} ${countryName}!`,
    ];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    this.emit(phrase, 'hazard', countryName, flag);
    sound.playCrowdGasp();
  }

  public onCheckpoint(current: number, total: number, leaderName: string, leaderFlag: string) {
    if (current === total - 1) {
      this.emit(`FINAL CHECKPOINT! ${leaderFlag} ${leaderName} is sprinting toward the finish line!`, 'checkpoint', leaderName, leaderFlag);
      sound.playCheckpoint();
      sound.playCrowdCheer(0.7);
    } else {
      const phrases = [
        `Checkpoint ${current}/${total}! ${leaderFlag} ${leaderName} holding a strong pace.`,
        `Through Checkpoint ${current}! The gap between racers is razor thin!`,
      ];
      this.emit(phrases[Math.floor(Math.random() * phrases.length)], 'checkpoint', leaderName, leaderFlag);
      sound.playCheckpoint();
    }
  }

  public onMegaJump(leaderName: string, leaderFlag: string) {
    const phrases = [
      `LOOK AT THAT AIRTIME! Big ramp launch from ${leaderFlag} ${leaderName}!`,
      `Massive jump over the chasm! What aerial control!`,
      `High-flying action off the launch pad!`,
    ];
    this.emit(phrases[Math.floor(Math.random() * phrases.length)], 'hype', leaderName, leaderFlag);
    sound.playCrowdCheer(0.8);
  }

  public onPhotoFinish(winnerName: string, winnerFlag: string, secondPlaceName: string) {
    const phrases = [
      `AND ACROSS THE LINE! ${winnerFlag} ${winnerName} TAKES VICTORY by inches over ${secondPlaceName}!`,
      `UNBELIEVABLE FINISH! ${winnerFlag} ${winnerName} snatches the win at the stripe!`,
      `CHEQUERED FLAG! What an epic performance from ${winnerFlag} ${winnerName}!`,
    ];
    this.emit(phrases[Math.floor(Math.random() * phrases.length)], 'finish', winnerName, winnerFlag, true);
    sound.playVictoryFanfare();
    sound.playCrowdCheer(1.0);
  }

  public onEliminationAnnounce(eliminatedCount: number, countries: string[]) {
    if (countries.length === 0) return;
    const names = countries.slice(0, 3).join(', ');
    const extra = countries.length > 3 ? ` and ${countries.length - 3} others` : '';
    const phrases = [
      `Tough break! ${names}${extra} have been eliminated from the Championship!`,
      `That's it for ${names}${extra}! Heartbreak as their tournament run ends here.`,
      `The cut line claims ${names}${extra}! Only the strongest survive!`,
    ];
    this.emit(phrases[Math.floor(Math.random() * phrases.length)], 'elimination', undefined, undefined, true);
  }

  public onGrandFinalWinner(championName: string, championFlag: string) {
    this.emit(
      `WORLD CHAMPION! ${championFlag} ${championName} HAS WON THE COUNTRY MARBLE WORLD CHAMPIONSHIP! INCREDIBLE GLORY!`,
      'finish',
      championName,
      championFlag,
      true
    );
    sound.playVictoryFanfare();
    sound.playCrowdCheer(1.0);
  }
}

export const commentary = new CommentaryEngine();
