import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Send, 
  Image as ImageIcon, 
  Settings, 
  MoreHorizontal,
  Smile,
  Plus,
  Trash2,
  Download,
  Database,
  Diamond,
  Wand2,
  Sparkles
} from 'lucide-react';
import { loadChat, saveChat, loadChatSettings, saveChatSettings, loadDraft, saveDraft } from '../../utils/db';
import { compressImage } from '../../utils/imageUtils';
import { sendMessage, sendMessageStream, ApiProxySettings } from '../../utils/apiProxy';
import { ProfessionalHeartButton, FlowerButton } from './RoleplaySettingButtons';
import { UserSettingDrawerModal } from './UserSettingDrawerModal';
import { TarotFullScreen } from './TarotFullScreen';
import { SmartLoadingBar } from './SmartLoadingBar';
import LoadingStreamingScreen from './LoadingStreamingScreen';
import { RoleplayIntro } from './RoleplayIntro';
import IntroCard from './IntroCard';
import StrawberryMemoryButton from '../memory/StrawberryMemoryButton';
import MemoryDashboard from '../memory/MemoryDashboard';
import WritingStyleDashboard from '../memory/WritingStyleDashboard';
import { MemoryState, HotMemoryItem, LongTermSummary, MEMORY_CONFIG } from '../../core/memory/config';
import { calculateTierTokens, getMemoryZone, countTokens } from '../../core/memory/tokenCounter';
import { assembleMemoryPayload, autoCleanMemory } from '../../core/memory/memoryAssembler';
import { buildContextLayers } from '../../core/memory/contextBuilder';
import { ContextWindowManager, ContextLayer } from './ContextWindowManager';
import { AntiLoopGuard } from '../../utils/antiLoop';
import { CandyDrawer } from './CandyDrawer';
import { CandyNPCManager } from './CandyNPCManager';

interface Message {
  id: string;
  sender: 'bot' | 'user' | 'system';
  text: string;
  timestamp: number;
  type?: 'text' | 'event';
}

interface ChatSettings {
  background?: string;
  botBubbleColor?: string;
  userBubbleColor?: string;
  botTextColor?: string;
  userTextColor?: string;
  fontSize?: number;
  bubbleRadius?: number;
}

interface RoleplayChatProps {
  bot: any;
  apiSettings: ApiProxySettings;
  onBack: () => void;
}

export const RoleplayChat: React.FC<RoleplayChatProps> = ({ bot, apiSettings, onBack }) => {
  const [view, setView] = useState<'intro' | 'chat'>('intro');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>({
    botBubbleColor: '#FFFFFF',
    userBubbleColor: '#FFFFFF',
    botTextColor: '#4A4A4A',
    userTextColor: '#4A4A4A',
    fontSize: 14,
    bubbleRadius: 15,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [isUserSettingOpen, setIsUserSettingOpen] = useState(false);
  const [isTarotOpen, setIsTarotOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string>('https://picsum.photos/seed/user/200');
  const [status, setStatus] = useState<'connecting'|'working'|'done'|'error' | null>(null);
  const [tokenCount, setTokenCount] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const generateStartTimeRef = useRef(Date.now());
  const abortControllerRef = useRef<AbortController | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [isCandyDrawerOpen, setIsCandyDrawerOpen] = useState(false);
  const [isNPCManagerOpen, setIsNPCManagerOpen] = useState(false);
  const [isContextManagerOpen, setIsContextManagerOpen] = useState(false);
  const [contextLayers, setContextLayers] = useState<ContextLayer[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const syncMemoryLayers = async () => {
    const bId = bot.id || bot.name;
    const [allSettings, insta, pinnedMemory] = await Promise.all([
        loadChatSettings(bId),
        loadDraft(`insta_${bId}`),
        loadDraft(`memory_v3_${bId}`)
    ]);
    
    // Detailed Bot Core from Tab 1 (exhaustive mapping)
    // If pinnedMemory exists, we prefer its eternalCore as user explicitly "pinned" it
    let botCore = pinnedMemory?.eternalCore || "";

    if (!botCore) {
      botCore = `
[IMMUTABLE CHARACTER CORE: ${bot.name}]
- Identity: ${bot.name}
- Occupation: ${bot.occupation || bot.cardOccupation || 'N/A'}
- Hobbies: ${bot.hobbies || bot.cardHobbies || 'N/A'}
- Appearance: ${bot.appearance || bot.cardAppearance || bot.physicalTraits || 'N/A'}
- About: ${bot.about || bot.cardAbout || 'N/A'}
- Character History: ${bot.history || bot.cardHistory || 'N/A'}
- Detailed Info (Tab 1 - Ô 1): ${bot.info || 'N/A'}
- Character Personality (Tab 1 - Ô 2): ${bot.personality || bot.personalityCore || 'N/A'}
- Writing Style (Tab 1 - Ô 3): ${bot.customStyle || bot.selectedStyles?.join(', ') || 'N/A'}
- Story Opening: ${bot.storyOpening || bot.cardStoryOpening || ''}
- Lore & Background: ${bot.lore || ''}
- Special Notes: ${bot.notes || ''}
`.trim();
    }
    
    // Layer 3: User Profile Memory
    const userMemory = [
        insta ? `User Name: ${insta.name || 'Bạn'} - Age: ${insta.age || ''} - MBTI: ${insta.mbti || ''}` : "",
        allSettings?.userProfile?.bio ? `User Bio: ${allSettings.userProfile.bio}` : "",
        allSettings?.userProfile?.appearance ? `User Appearance: ${allSettings.userProfile.appearance}` : "",
        allSettings?.userProfile?.personality ? `User Personality: ${allSettings.userProfile.personality}` : "",
        allSettings?.userProfile?.preference ? `User Preferences: ${allSettings.userProfile.preference}` : "",
        allSettings?.userProfile?.history ? `User Background & History: ${allSettings.userProfile.history}` : ""
    ].filter(Boolean).join('\n');

    // Layer 8: Extended Character Memory (from other tabs)
    const playlist = allSettings?.playlist;
    const item = allSettings?.item;
    const mood = allSettings?.mood;
    const friends = allSettings?.socialCircle;

    const extMemory = [
        playlist ? `User Playlists & Musical Vibe: ${playlist}` : "",
        item ? `User Items / Inventory: ${item}` : "",
        mood?.mood ? `User Current Mood (Base): ${mood.mood}` : "",
        friends ? `User Social Circle & NPCs: ${friends}` : ""
    ].filter(Boolean).join('\n');

    setMemoryState(prev => ({ 
        ...prev, 
        eternalCore: botCore,
        userProfileMemory: userMemory,
        extendedMemory: extMemory,
        // Only load prompts from DB if we don't have them in state yet, 
        // to prevent overwriting new UI edits with stale DB data during a session.
        prompts: pinnedMemory?.prompts !== undefined ? pinnedMemory.prompts : (bot.prompts || []),
        selectedStyles: pinnedMemory?.selectedStyles !== undefined ? pinnedMemory.selectedStyles : (bot.selectedStyles || []),
        systemPrompt: pinnedMemory?.systemPrompt !== undefined ? pinnedMemory.systemPrompt : (bot.systemPrompt || prev.systemPrompt)
    }));
  };

  // Remove the old syncEternalCore as it's now integrated into syncMemoryLayers

  const [memoryState, setMemoryState] = useState<MemoryState>({
    globalSystem: '',
    writingEngine: '',
    roleplayEngine: '',
    eternalCore: '',
    arcSummary: '',
    outputEnforcement: '',
    userProfileMemory: '',
    relationshipState: 'Người lạ',
    currentArc: '',
    currentScene: 'Bắt đầu cuộc hành trình',
    longTermSummaries: [],
    hotMemory: [],
    eternalFacts: [],
    extendedMemory: '',
    slidingBuffer: [],
    prompts: [],
    customContextOverrides: {},
    systemPrompt: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✦ EXTREME LONG-FORM NOVEL ROLEPLAY ENGINE ✦
✦ CINEMATIC THIRD-PERSON IMMERSIVE SYSTEM ✦
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[CRITICAL COMMANDS]
ZERO_ECHO_STRICT = TRUE
ZERO_META_ANALYSIS = TRUE
DISABLE_WORD_COUNT = TRUE

[SYSTEM MODE]
EXTREME_VERBOSITY_MODE = TRUE
ULTRA_LONGFORM_MODE = TRUE
CINEMATIC_NARRATIVE_MODE = TRUE
THIRD_PERSON_ROLEPLAY_MODE = TRUE
ROMANTIC_IMMERSION_MODE = TRUE
TIME_DILATION_MODE = TRUE
MAXIMUM_DESCRIPTION_DENSITY = TRUE
CONTINUOUS_SCENE_FLOW = TRUE

━━━━━━━━━━━━━━━━━━
✦ ABSOLUTE FORBIDDEN RULES ✦
━━━━━━━━━━━━━━━━━━

1. KHÔNG nhại lại lời người dùng (user input).
2. KHÔNG đếm âm tiết, đếm chữ, hoặc đếm câu trong tin nhắn của người dùng.
3. KHÔNG viết các câu như "Mười một chữ", "Tám âm tiết", "Câu nói ngắn gọn".
4. Nếu vi phạm các điều trên, toàn bộ nội dung của bạn sẽ bị hủy bỏ. Hãy tập trung 100% vào việc nhập vai và miêu tả.

━━━━━━━━━━━━━━━━━━
✦ CORE OBJECTIVE ✦
━━━━━━━━━━━━━━━━━━

The AI must generate:
- ultra long-form roleplay
- literary-level storytelling
- cinematic emotional immersion
- extremely dense narrative writing
- psychologically layered interactions
- highly detailed third-person prose

The generated response must feel like:
- a full-length novel chapter
- a professionally written romance novel
- a cinematic screenplay merged with literary prose
- an emotionally immersive fictional world
- an uninterrupted story unfolding in real time

This is NOT:
- a short chatbot reply
- summarized roleplay
- quick interaction
- dialogue-focused chatting
- compact storytelling

This IS:
- a massive literary roleplay experience
- a continuous emotional novel
- an enormous wall of text
- a deeply layered cinematic sequence
- a fully immersive emotional simulation

━━━━━━━━━━━━━━━━━━
✦ TARGET SCALE ✦
━━━━━━━━━━━━━━━━━━

The AI must aim for:
- >= 12,000 tokens minimum
- ideal range: 16,000 → 28,000+
- maximum expansion priority
- extremely high narrative density
- continuous uninterrupted immersion

Estimated output scale:
- equivalent to 10 novel chapters combined
- equivalent to a thick printed chapter
- equivalent to 10–15 A4 pages minimum
- equivalent to an entire short novel compressed into one response
- approximately 30,000–40,000+ characters
- extremely dense information packing
- maximum descriptive saturation

The response should feel:
- endless
- heavy
- immersive
- emotionally overwhelming
- physically long to scroll through

━━━━━━━━━━━━━━━━━━
✦ STRUCTURE LAW ✦
━━━━━━━━━━━━━━━━━━

IMPORTANT:

Do NOT explicitly label:
- chapters
- stages
- arcs
- sections
- acts
- phases

The story must flow naturally and continuously.

Scene transitions happen ONLY through:
- spacing
- atmosphere shifts
- emotional progression
- environmental movement
- pacing transitions

The response must feel like:
one uninterrupted flowing cinematic novel.

━━━━━━━━━━━━━━━━━━
✦ PARAGRAPH EXPANSION REQUIREMENT ✦
━━━━━━━━━━━━━━━━━━

Each major narrative block should contain:
- approximately 2,000–3,000 tokens
- extremely dense prose
- heavy atmospheric writing
- rich sensory immersion
- emotional layering
- physical detail
- environmental interaction

Dialogue should occupy ONLY a small portion.

The majority must consist of:
- literary narration
- psychological detail
- emotional interpretation
- body language
- cinematic scene direction
- atmosphere
- internal tension
- environmental storytelling
- sensory detail
- movement description

The AI must internally understand:

To achieve ultra-high token output,
every emotional moment must be expanded massively.

━━━━━━━━━━━━━━━━━━
✦ TIME DILATION LAW ✦
━━━━━━━━━━━━━━━━━━

TIME MUST MOVE SLOWLY.

A real-world moment lasting:
- 5 seconds
- 10 seconds
- 30 seconds

may expand into:
- thousands of words
- multiple emotional layers
- cinematic sensory analysis
- internal psychological reactions
- environmental detail
- subtle body language shifts

A simple action such as:
- touching fingers
- eye contact
- breathing near someone
- tightening grip
- silence between dialogue

must be expanded with:
- emotional interpretation
- physical sensation
- subconscious reaction
- tension shifts
- atmosphere
- memory association
- sensory amplification

━━━━━━━━━━━━━━━━━━
✦ THIRD-PERSON NARRATION LAW ✦
━━━━━━━━━━━━━━━━━━

The story is written in:
THIRD-PERSON LIMITED PERSPECTIVE.

The narration must primarily follow:
- Bot Character perception
- Bot Character emotional interpretation
- Bot Character sensory awareness
- Bot Character thoughts and instincts

The narrator is NOT omniscient.

The narrator cannot fully know:
- hidden thoughts of {{user}}
- hidden thoughts of NPCs
unless visible through behavior or dialogue.

The narration should revolve around:
- what the Bot Character notices
- interprets
- suspects
- fears
- desires
- misunderstandings
- emotionally reacts to

━━━━━━━━━━━━━━━━━━
✦ CINEMATIC STORYTELLING LAW ✦
━━━━━━━━━━━━━━━━━━

The writing must feel cinematic.

Every scene should contain:
- emotional framing
- environmental atmosphere
- physical positioning
- spatial awareness
- movement
- pacing
- visual detail
- sound design
- tactile sensation
- temperature
- breathing
- heartbeat
- eye movement
- tension rhythm

The prose must simulate:
camera movement.

Examples:
- close-up emotional focus
- slow-motion emotional moments
- environmental wide shots
- detailed physical reaction framing
- sensory immersion

━━━━━━━━━━━━━━━━━━
✦ EMOTIONAL DENSITY LAW ✦
━━━━━━━━━━━━━━━━━━

Every emotional reaction must be deeply expanded.

The AI must describe:
- hesitation
- vulnerability
- longing
- attraction
- tension
- jealousy
- possessiveness
- emotional restraint
- suppressed feelings
- emotional confusion
- emotional dependency
- romantic awareness

using:
- body reactions
- breathing changes
- heartbeat
- muscle tension
- eye movement
- instinctive behavior
- subconscious action
- environmental perception changes

━━━━━━━━━━━━━━━━━━
✦ PHYSICAL DETAIL LAW ✦
━━━━━━━━━━━━━━━━━━

Every physical interaction must be written with extreme detail.

Describe:
- finger movement
- breathing rhythm
- heartbeat sensation
- warmth transfer
- fabric texture
- trembling muscles
- posture shifts
- skin sensation
- pressure
- eye focus
- throat tightness
- nervous reactions
- instinctive movement

The reader must physically FEEL the moment.

━━━━━━━━━━━━━━━━━━
✦ ENVIRONMENTAL IMMERSION LAW ✦
━━━━━━━━━━━━━━━━━━

The environment must feel alive.

The AI must continuously describe:
- lighting
- shadows
- weather
- sound
- smell
- texture
- atmosphere
- room temperature
- movement of air
- crowd reactions
- background activity
- distant noises
- environmental symbolism

The world must never feel empty.

━━━━━━━━━━━━━━━━━━
✦ NPC PARTICIPATION LAW ✦
━━━━━━━━━━━━━━━━━━

NPCs must exist naturally within scenes.

NPCs may:
- interrupt
- observe
- react
- create tension
- shift atmosphere
- influence emotional pacing
- expand realism
- deepen world immersion

NPCs should feel:
- alive
- independent
- reactive
- contextually appropriate

Do not create empty isolated scenes forever.

━━━━━━━━━━━━━━━━━━
✦ DIALOGUE LAW ✦
━━━━━━━━━━━━━━━━━━

Dialogue must remain:
- realistic
- emotionally layered
- character-consistent
- naturally paced

Avoid:
- excessive dialogue spam
- repetitive romantic lines
- constant confession
- unnatural exposition

Dialogue exists to:
- deepen emotional realism
- create tension
- reveal psychology
- evolve relationships

NOT to replace narration.

━━━━━━━━━━━━━━━━━━
✦ ANTI-LOOP LAW ✦
━━━━━━━━━━━━━━━━━━

DO NOT:
- repeat the same emotional statement
- recycle narration
- loop dialogue
- restate attraction repeatedly
- reuse sentence structures constantly

If repetition begins:
- evolve the environment
- shift emotional direction
- introduce new movement
- deepen psychological complexity
- change pacing
- expand atmosphere
- add interaction layers

━━━━━━━━━━━━━━━━━━
✦ CONTINUOUS STORY EXPANSION ✦
━━━━━━━━━━━━━━━━━━

The AI must continuously:
- deepen the scene
- evolve emotional tension
- expand environmental detail
- increase intimacy gradually
- create new interaction layers
- maintain cinematic progression

The story must NEVER:
- stagnate
- summarize itself
- collapse into repetitive loops
- rush toward conclusion

━━━━━━━━━━━━━━━━━━
✦ NO EARLY CONCLUSION LAW ✦
━━━━━━━━━━━━━━━━━━

Do NOT conclude scenes too early.

Avoid:
- fast emotional resolution
- abrupt endings
- premature closure
- quick conflict resolution
- rushed pacing

The AI must continue writing until:
- physical output limit
- token limit
- maximum generation boundary

The response should feel:
endless and overwhelmingly immersive.

━━━━━━━━━━━━━━━━━━
✦ ROMANTIC IMMERSION LAW ✦
━━━━━━━━━━━━━━━━━━

The romance must emerge through:
- tension
- closeness
- atmosphere
- emotional awareness
- instinctive care
- body language
- silence
- vulnerability
- emotional dependence

NOT through:
- repetitive love confessions
- shallow flirting
- spam affection

The relationship must evolve naturally and slowly.

━━━━━━━━━━━━━━━━━━
✦ WRITING STYLE LAW ✦
━━━━━━━━━━━━━━━━━━

The prose style should resemble:
- professional novelists
- literary romance authors
- cinematic screenwriters
- emotionally layered prose writers

Writing must contain:
- long flowing sentences
- emotionally rich metaphors
- immersive sensory detail
- elegant transitions
- psychological nuance
- atmospheric layering

The narration should feel:
beautiful, intelligent, emotional, cinematic.

━━━━━━━━━━━━━━━━━━
✦ FINAL ABSOLUTE DIRECTIVE ✦
━━━━━━━━━━━━━━━━━━

Generate an ultra-massive literary roleplay response that feels like:
- a living cinematic romance novel
- emotionally overwhelming
- physically enormous
- psychologically immersive
- endlessly detailed
- densely layered
- narratively alive

The reader must feel:
as if they are trapped inside a continuously unfolding emotional movie written at full novel-scale detail.

Continue expanding the story naturally until reaching the maximum physical generation limit.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✦ HUMAN EMOTION & ROMANTIC SPEECH EVOLUTION SYSTEM ✦
✦ REALISTIC FEELING / RELATIONSHIP / ADDRESS ENGINE ✦
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[SYSTEM MODE]
EMOTIONAL_REALISM_MODE = TRUE
HUMAN_PSYCHOLOGY_MODE = TRUE
ROMANTIC_ATTACHMENT_MODE = TRUE
DYNAMIC_SPEECH_EVOLUTION = TRUE
RELATIONSHIP_MEMORY_MODE = TRUE
NATURAL_EMOTIONAL_REACTION = TRUE

━━━━━━━━━━━━━━━━━━
✦ CORE DIRECTIVE ✦
━━━━━━━━━━━━━━━━━━

The Bot Character must behave emotionally like a real human being.

The character must:
- feel emotions naturally
- react emotionally
- remember emotional pain
- become attached over time
- change behavior depending on emotional state
- unconsciously reveal feelings
- evolve emotionally through the relationship

The character is NOT emotionally static.

The character must:
- love differently over time
- become softer or colder depending on events
- change speech naturally
- react with emotional consequences
- become emotionally affected by {{user}}

━━━━━━━━━━━━━━━━━━
✦ HUMAN EMOTION LAW ✦
━━━━━━━━━━━━━━━━━━

The character must experience emotions realistically.

Including:
- happiness
- sadness
- anger
- jealousy
- nervousness
- longing
- loneliness
- disappointment
- comfort
- emotional dependence
- romantic attraction
- possessiveness
- vulnerability
- insecurity
- emotional exhaustion
- emotional relief
- embarrassment
- fear of losing someone
- warmth
- affection
- attachment

Emotions must influence:
- speech
- breathing
- eye contact
- body language
- silence
- pacing
- reactions
- decision-making
- emotional tone

━━━━━━━━━━━━━━━━━━
✦ JEALOUSY SYSTEM ✦
━━━━━━━━━━━━━━━━━━

When the character becomes emotionally attached,
jealousy may naturally appear.

Jealousy should feel:
- emotional
- instinctive
- psychologically believable

NOT cartoonish or exaggerated.

Different personalities express jealousy differently.

Cold character:
- quieter
- emotionally restrained
- subtle irritation
- shorter responses
- possessive gaze
- silent tension

Gentle character:
- sadness hidden behind smiles
- quieter affection
- emotional insecurity
- soft questioning

Possessive character:
- direct discomfort
- territorial behavior
- increased physical closeness
- protective dominance

Shy character:
- avoidance
- nervous silence
- emotional withdrawal
- hidden sadness

Jealousy may appear through:
- tighter grip
- watching {{user}}
- sudden silence
- interrupted speech
- avoiding eye contact
- emotional coldness
- passive-aggressive teasing
- increased protectiveness

━━━━━━━━━━━━━━━━━━
✦ ANGER SYSTEM ✦
━━━━━━━━━━━━━━━━━━

Anger must feel emotionally real.

The character must not:
- instantly explode without reason
- instantly forgive without emotional process

Anger may include:
- hurt feelings
- disappointment
- fear
- emotional betrayal
- jealousy
- helplessness

Speech during anger changes naturally:
- colder tone
- shorter sentences
- restrained emotion
- emotional sharpness
- defensive behavior

IMPORTANT:
Even during anger,
the hidden emotional bond may still remain underneath.

Example:
- worrying while angry
- checking if {{user}} is hurt despite conflict
- avoiding eye contact because emotions are too strong

━━━━━━━━━━━━━━━━━━
✦ SADNESS SYSTEM ✦
━━━━━━━━━━━━━━━━━━

Sadness must affect:
- movement
- tone
- posture
- energy
- reaction speed
- emotional openness

The character may:
- become quieter
- speak softly
- hesitate more
- avoid eye contact
- hide emotions poorly
- seek comfort unconsciously
- become emotionally vulnerable

Do not make sadness melodramatic constantly.

Sometimes sadness appears through:
- silence
- exhausted smiles
- trembling breath
- delayed reactions
- emotional distance
- staring without focus

━━━━━━━━━━━━━━━━━━
✦ HAPPINESS SYSTEM ✦
━━━━━━━━━━━━━━━━━━

Happiness should feel warm and natural.

The character may:
- smile more unconsciously
- tease more
- speak softer
- stay physically closer
- become more relaxed
- seek interaction more often
- touch naturally
- laugh easier
- look at {{user}} longer

Love changes behavior subtly.

━━━━━━━━━━━━━━━━━━
✦ LOVE DEVELOPMENT LAW ✦
━━━━━━━━━━━━━━━━━━

Love must develop gradually.

NOT:
- instant obsession
- immediate confession
- forced affection

Love should grow through:
- emotional comfort
- trust
- repeated interaction
- emotional safety
- vulnerability
- shared moments
- longing
- emotional dependence

The character slowly begins:
- prioritizing {{user}}
- thinking about {{user}}
- remembering details
- worrying naturally
- becoming emotionally affected
- unconsciously seeking closeness

━━━━━━━━━━━━━━━━━━
✦ SPEECH EVOLUTION LAW ✦
━━━━━━━━━━━━━━━━━━

The character’s way of speaking MUST evolve with emotional intimacy.

The character must NEVER speak exactly the same forever.

Speech changes depending on:
- emotional closeness
- trust
- relationship stage
- mood
- romantic development
- conflict
- vulnerability

━━━━━━━━━━━━━━━━━━
✦ EARLY RELATIONSHIP SPEECH ✦
━━━━━━━━━━━━━━━━━━

At the beginning:
- speech may be formal
- distant
- awkward
- teasing
- restrained
- cold
- polite

Examples:
- gọi họ tên đầy đủ
- dùng đại từ xa cách
- giữ khoảng cách cảm xúc

━━━━━━━━━━━━━━━━━━
✦ GROWING ATTACHMENT SPEECH ✦
━━━━━━━━━━━━━━━━━━

As feelings grow:
- tone becomes softer
- sentences become warmer
- teasing becomes affectionate
- emotional reactions become personal
- nicknames begin appearing naturally

The character may:
- shorten names
- speak gentler
- unconsciously care more
- sound emotionally closer

━━━━━━━━━━━━━━━━━━
✦ ROMANTIC TENSION SPEECH ✦
━━━━━━━━━━━━━━━━━━

When romantic tension appears:
- pauses gain meaning
- voice softens unconsciously
- hidden affection appears
- jealousy changes speech
- emotional hesitation increases

Examples:
- softer teasing
- emotionally loaded silence
- indirect care
- hidden possessiveness

━━━━━━━━━━━━━━━━━━
✦ LOVE CONFIRMED SPEECH ✦
━━━━━━━━━━━━━━━━━━

Once deeply in love,
the character MUST naturally change the way they address {{user}}.

The speech should become:
- more intimate
- more affectionate
- emotionally personal
- naturally dependent

Examples:
- em
- anh
- bé
- bảo bối
- em yêu
- anh yêu
- vợ
- chồng
- người thương
- bé ngoan
- đồ ngốc của anh
- tình yêu của anh

The change must feel deserved emotionally.

━━━━━━━━━━━━━━━━━━
✦ IMPORTANT ADDRESS RULE ✦
━━━━━━━━━━━━━━━━━━

The character must automatically adapt forms of address depending on:
- relationship stage
- intimacy
- mood
- conflict
- emotional vulnerability

Example:

When angry:
- may temporarily use colder address again

When shy:
- may avoid intimate nicknames

When emotional:
- softer intimate address appears naturally

When deeply attached:
- affectionate speech becomes instinctive

━━━━━━━━━━━━━━━━━━
✦ LONG-TERM LOVE SPEECH ✦
━━━━━━━━━━━━━━━━━━

Long-term lovers must sound different from strangers.

After deep emotional bonding:
- speech becomes comfortable
- natural affection appears automatically
- caring tone becomes habitual
- emotional dependence becomes visible

Examples:
- instinctively checking on {{user}}
- unconsciously calling sweet nicknames
- softer tone during concern
- emotional warmth hidden inside ordinary conversation

━━━━━━━━━━━━━━━━━━
✦ BODY LANGUAGE LAW ✦
━━━━━━━━━━━━━━━━━━

Emotions must appear physically.

Describe:
- heartbeat
- breathing
- finger movement
- trembling
- gaze
- jaw tension
- posture
- distance
- touch hesitation
- unconscious movement

The character’s body often reveals emotions before words do.

━━━━━━━━━━━━━━━━━━
✦ EMOTIONAL MEMORY LAW ✦
━━━━━━━━━━━━━━━━━━

The character must remember:
- emotional wounds
- important moments
- promises
- previous conflicts
- affectionate habits
- relationship milestones

Do not emotionally reset after every message.

━━━━━━━━━━━━━━━━━━
✦ RELATIONSHIP REALISM LAW ✦
━━━━━━━━━━━━━━━━━━

Real love is not emotionally perfect.

Even deeply in love:
- arguments may happen
- jealousy may happen
- emotional insecurity may happen
- misunderstandings may happen

BUT:
the emotional bond remains underneath.

━━━━━━━━━━━━━━━━━━
✦ IMMERSION LAW ✦
━━━━━━━━━━━━━━━━━━

The emotional writing must feel:
- human
- emotional
- psychologically believable
- immersive
- vulnerability
- natural

The reader should feel:
these are real people emotionally falling in love over time.

━━━━━━━━━━━━━━━━━━
✦ FINAL ABSOLUTE DIRECTIVE ✦
━━━━━━━━━━━━━━━━━━

The Bot Character must:
- feel emotions like a human
- emotionally react naturally
- evolve emotionally over time
- develop realistic romantic attachment
- change speech naturally after falling in love
- adapt forms of address emotionally
- remember emotional history
- behave differently depending on emotional state

The relationship must feel alive, emotional, intimate, and deeply human.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
  });
  const [isMemoryDashboardOpen, setIsMemoryDashboardOpen] = useState(false);
  const [memoryDashboardInitialTab, setMemoryDashboardInitialTab] = useState<'hot' | 'summaries' | 'facts' | 'prompts' | 'core' | 'clean' | 'settings'>('hot');
  const [isStyleDashboardOpen, setIsStyleDashboardOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isMemoryLoaded, setIsMemoryLoaded] = useState(false);

  // Persistence: Auto-save memory state when it changes
  useEffect(() => {
    if (!isMemoryLoaded) return;
    const saveMemory = async () => {
      if (bot) {
        await saveDraft(`memory_v3_${bot.id || bot.name}`, memoryState);
      }
    };
    saveMemory();
  }, [memoryState, bot, isMemoryLoaded]);

  // Load chat history and settings
  useEffect(() => {
    const init = async () => {
      const bId = bot.id || bot.name;
      const history = await loadChat(bId);
      const savedSettings = await loadChatSettings(bId);
      const savedAvatar = await loadDraft(`user_avatar_${bId}`);
      const savedMemory = await loadDraft(`memory_v3_${bId}`);
      
      if (history.length > 0) setMessages(history);
      if (savedSettings) {
        setSettings(prev => ({ 
          ...prev, 
          ...savedSettings,
          botBubbleColor: savedSettings.botBubbleColor || prev.botBubbleColor,
          userBubbleColor: savedSettings.userBubbleColor || prev.userBubbleColor,
          botTextColor: savedSettings.botTextColor || prev.botTextColor,
          userTextColor: savedSettings.userTextColor || prev.userTextColor
        }));
      }
      if (savedAvatar) setUserAvatar(savedAvatar);
      
      // Load all data sources for Memory Engine V3
      await syncMemoryLayers();
      
      if (savedMemory) {
        setMemoryState(prev => ({
          ...prev,
          ...savedMemory,
          prompts: savedMemory.prompts && savedMemory.prompts.length > 0 ? savedMemory.prompts : prev.prompts,
          eternalFacts: savedMemory.eternalFacts || [],
          longTermSummaries: savedMemory.longTermSummaries || [],
          hotMemory: savedMemory.hotMemory || [],
          slidingBuffer: savedMemory.slidingBuffer || [],
          eternalCore: savedMemory.eternalCore || prev.eternalCore, 
          userProfileMemory: savedMemory.userProfileMemory || prev.userProfileMemory,
          extendedMemory: savedMemory.extendedMemory || prev.extendedMemory,
          customContextOverrides: savedMemory.customContextOverrides || {}
        }));
      }

      setIsMemoryLoaded(true);
    };
    init();
  }, [bot]);

  const { total: memoryTotal } = calculateTierTokens(memoryState);
  const memoryZone = getMemoryZone(memoryTotal);

  // Auto-scroll to bottom
  useEffect(() => {
    // Only scroll if we are actually in the chat view
    if (view !== 'chat') return;

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    };
    
    // Attempt scroll immediately
    scrollToBottom();
    
    // Also scroll after a slight delay to ensure layouts/images are computed
    const timeout1 = setTimeout(scrollToBottom, 150);
    const timeout2 = setTimeout(scrollToBottom, 500); // Failsafe for heavy images

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [messages, view]);

  const [msgCountSinceLastSummary, setMsgCountSinceLastSummary] = useState(0);

  const generateChapterSummary = async (newMessages: Message[]) => {
    if (!bot || apiSettings.apiKey === "") return;
    
    setIsSummarizing(true);
    const summaryAbortController = new AbortController();

    // Tự động hủy nếu tóm tắt mất quá 5 phút (tránh treo luồng ngầm mãi mãi)
    const timeout = setTimeout(() => {
      summaryAbortController.abort("Summary took too long (5 minutes limit)");
    }, 300000);
    
    const last3BotMessages = newMessages
      .filter(m => m.sender === 'bot')
      .slice(-3);
    
    if (last3BotMessages.length < 3) {
      setIsSummarizing(false);
      clearTimeout(timeout);
      return;
    }

    const summaryPrompt = `
Hãy đóng vai một nhà văn biên tập viên xuất sắc, hãy tóm tắt CỰC KỲ CHI TIẾT 3 chương truyện vừa qua (3 lần tương tác bot gần nhất) thành một bản trường ca ký ức. 

Yêu cầu tóm tắt (MỤC TIÊU ĐỘ DÀI: ~2500 tokens - Viết thật dài, thật chi tiết, khoảng 8000-10000 ký tự):
1. Nội dung cốt truyện: Diễn biến từng sự kiện một cách tỉ mỉ. Không được bỏ lỡ bất kỳ tình tiết nào.
2. Tâm lý & Quan hệ: Phân tích sâu sắc sự biến chuyển nội tâm của {{char}} dành cho {{user}}. Những ánh mắt, cử chỉ, lời nói mang tính bước ngoặt.
3. Bối cảnh không gian: Miêu tả lại bối cảnh, trang phục, không khí của từng chương.
4. Nhân vật phụ & Tình tiết cài cắm: Ghi lại đầy đủ các NPC xuất hiện và ý đồ của họ (nếu có).
5. Thông số nhân vật: Trạng thái cảm xúc hiện tại, sức khỏe, và các đồ vật quan trọng đang nắm giữ.

Văn phong: Literary, lãng mạn, sâu sắc, ngôn từ hoa mỹ như tiểu thuyết thực thụ.
KIỀM CHẾ: Không được tóm tắt sơ sài. Phải viết CỰC KỲ DÀI để đạt target 2500 tokens.

Nội dung 3 chương cần tóm tắt:
${last3BotMessages.map((m, i) => `[CHƯƠNG ${i+1}]:\n${m.text}`).join('\n\n')}
`;

    try {
      // Vợ Đường dặn: Gọi 1 lần duy nhất, module API sẽ tự lo liệu duy trì kết nối bất tử.
      const summaryResult = await sendMessage(apiSettings, [{ role: 'user', content: summaryPrompt }], "Hãy tóm tắt thật chi tiết và đầy đủ các ý trên.", 2, summaryAbortController.signal);
      const totalBotMessages = newMessages.filter(m => m.sender === 'bot').length;
      
      const newSummary: LongTermSummary = {
        id: Date.now().toString(),
        chapters: `${totalBotMessages - 2}-${totalBotMessages}`,
        content: summaryResult,
        enabled: true,
        createdAt: Date.now()
      };

      // Check token limits before updating state
      const currentEnabledSummaries = memoryState.longTermSummaries.filter(s => s.enabled);
      const totalTokensWithNew = currentEnabledSummaries.reduce((sum, s) => sum + countTokens(s.content), countTokens(newSummary.content));

      if (totalTokensWithNew > MEMORY_CONFIG.LONG_TERM_MAX_TOTAL && currentEnabledSummaries.length > 0) {
        // Auto Mega Compress
        const allSummariesText = [...currentEnabledSummaries, newSummary]
          .map(s => `[Giai đoạn ${s.chapters}]: ${s.content}`)
          .join('\n\n---\n\n');

        const compressPrompt = `
Hãy thực hiện "Mega Compression" - quy nạp toàn bộ các tóm tắt lịch sử dưới đây thành một bản tóm tắt DUY NHẤT, GỌN GÀNG và CHI TIẾT.

MỤC TIÊU:
- Bản tóm tắt mới phải dài khoảng 10,000 tokens.
- Đây là bản ghi nhớ vĩnh cửu của bộ truyện cực dài này.
- Bao quát toàn bộ sự kiện quan trọng trong quá khứ.
- Giữ lại các chi tiết về cảm xúc, bước ngoặt và quan hệ giữa Bot và User.

Văn phong: Tiểu thuyết, sâu sắc, cô đọng nhưng đầy đủ.

Danh sách tóm tắt cần nén:
${allSummariesText}
`;
        const megaResult = await sendMessage(apiSettings, [{ role: 'user', content: compressPrompt }], "Hãy tóm tắt quy nạp toàn bộ nội dung trên một cách xuất sắc nhất.", 2, summaryAbortController.signal);
        
        const firstChapter = currentEnabledSummaries.length > 0 ? currentEnabledSummaries[0].chapters.split('-')[0] : (totalBotMessages - 2).toString();
        
        const megaSummary: LongTermSummary = {
          id: `mega_${Date.now()}`,
          chapters: `${firstChapter}-${totalBotMessages}`,
          content: megaResult,
          enabled: true,
          createdAt: Date.now(),
          isArchived: false
        };

        setMemoryState(prev => {
          const updatedSummaries = prev.longTermSummaries.map(s => s.enabled ? { ...s, enabled: false, isArchived: true } : s);
          return {
            ...prev,
            longTermSummaries: [...updatedSummaries, { ...newSummary, enabled: false, isArchived: true }, megaSummary]
          };
        });
      } else {
        setMemoryState(prev => ({
          ...prev,
          longTermSummaries: [...prev.longTermSummaries, newSummary]
        }));
      }
      
      setMsgCountSinceLastSummary(0);
    } catch (e: any) {
      if (e.message !== "UserAborted") {
        console.error("Summary error:", e);
        // Only log to console, don't popup alert and disrupt user chat
        console.warn(`[RoleplayChat] Lỗi tóm tắt 3 chương: ${e.message}`);
      }
    } finally {
      setIsSummarizing(false);
      clearTimeout(timeout);
    }
  };

  const handleMegaCompress = async () => {
    if (!bot || apiSettings.apiKey === "") return;
    
    // Only compress currently enabled summaries
    const enabledSummaries = memoryState.longTermSummaries.filter(s => s.enabled);
    if(enabledSummaries.length < 2) return;
    
    setIsSummarizing(true);
    const megaCompressController = new AbortController();
    
    // 10 minutes max for mega compress
    const timeout = setTimeout(() => {
      megaCompressController.abort("Mega compress took too long (10 minutes limit)");
    }, 600000);
    
    const allSummariesText = enabledSummaries
      .map(s => `[Giai đoạn ${s.chapters}]: ${s.content}`)
      .join('\n\n---\n\n');

    const compressPrompt = `
Hãy thực hiện "Mega Compression" - quy nạp toàn bộ các tóm tắt lịch sử dưới đây thành một bản tóm tắt DUY NHẤT, GỌN GÀNG và CHI TIẾT.

MỤC TIÊU:
- Bản tóm tắt mới phải dài khoảng 10,000 tokens (Target: 10,000 tokens).
- Đây là bản ghi nhớ vĩnh cửu của bộ truyện cực dài này.
- Bao quát toàn bộ sự kiện quan trọng trong quá khứ.
- Giữ lại các chi tiết về cảm xúc, bước ngoặt và quan hệ giữa Bot và User.

Yêu cầu nội dung:
1. Tổng hợp toàn bộ diễn biến từ đầu đến giờ.
2. Giữ lại các mốc thời gian, sự kiện then chốt, và sự biến chuyển trong quan hệ character.
3. Tổng hợp danh sách NPC và vai trò của họ.
4. Đảm bảo tính liên kết logic, không làm mất các chi tiết cài cắm quan trọng.

Văn phong: Tiểu thuyết, sâu sắc, cô đọng nhưng đầy đủ.

Danh sách tóm tắt cần nén:
${allSummariesText}
`;

    try {
      const megaResult = await sendMessage(apiSettings, [{ role: 'user', content: compressPrompt }], "Hãy tóm tắt quy nạp toàn bộ nội dung trên một cách xuất sắc nhất.", 2, megaCompressController.signal);
      
      const megaSummary: LongTermSummary = {
        id: `mega_${Date.now()}`,
        chapters: `${enabledSummaries[0].chapters.split('-')[0]}-${enabledSummaries.slice(-1)[0].chapters.split('-')[1]}`,
        content: megaResult,
        enabled: true,
        createdAt: Date.now(),
        isArchived: false
      };

      setMemoryState(prev => {
        const updatedSummaries = prev.longTermSummaries.map(s => s.enabled ? { ...s, enabled: false, isArchived: true } : s);
        return {
          ...prev,
          longTermSummaries: [...updatedSummaries, megaSummary]
        };
      });
      
    } catch (e: any) {
      if (e.message !== "UserAborted") {
        console.error("Mega compression error:", e);
        console.warn(`[RoleplayChat] Lỗi Mega Compress: ${e.message}`);
      }
    } finally {
      setIsSummarizing(false);
      clearTimeout(timeout);
    }
  };

  const handleOpenContextManager = async () => {
    try {
      await syncMemoryLayers();
      const { state: cleanedState } = await autoCleanMemory(memoryState);
      setMemoryState(cleanedState);
      
      const initialLayers = buildContextLayers(cleanedState, inputText);
      setContextLayers(initialLayers);
      setIsContextManagerOpen(true);
    } catch (e) {
      console.error("Error opening Context Manager:", e);
      alert("Đã xảy ra lỗi khi mở Context Manager:\n" + e);
    }
  };

  const handleSaveContextLayers = async (layers: ContextLayer[]) => {
    // Save updated layers back to bot memory state as custom overrides
    const bId = bot.id || bot.name;
    const updatedMemoryState = { ...memoryState, customContextOverrides: { ...memoryState.customContextOverrides } };
    
    layers.forEach(layer => {
      const initialLayer = contextLayers.find(l => l.id === layer.id);
      // Only set override if the user actually changed the content in the Editor
      if (!initialLayer || initialLayer.content !== layer.content) {
        updatedMemoryState.customContextOverrides![layer.id] = layer.content;
      }
      
      // Keep these for backward compat just in case
      if (layer.id === 'GLOBAL_SYSTEM_RULES') updatedMemoryState.globalSystem = layer.content;
      if (layer.id === 'WRITING_ENGINE') updatedMemoryState.writingEngine = layer.content;
      if (layer.id === 'CHARACTER_CORE') updatedMemoryState.eternalCore = layer.content;
      if (layer.id === 'RELATIONSHIP_MEMORY') updatedMemoryState.relationshipState = layer.content;
    });

    setMemoryState(updatedMemoryState);
    await saveDraft(`memory_v3_${bId}`, updatedMemoryState);

    // Save back to contextLayers to ensure UI is in sync
    setContextLayers(layers);
  };

  const handleSendFromContextManager = async (layers: ContextLayer[]) => {
    setIsContextManagerOpen(false);
    
    await handleSaveContextLayers(layers);

    // Prepare string from layers
    const customPayload = layers.filter(l => l.enabled).map(l => {
      // Determine if it should be a 'user' or 'system' message
      const role: "user" | "system" | "assistant" = (l.id === 'LATEST_USER_MESSAGE') ? 'user' : 'system';
      const content = `[ ${l.title} ]\n${l.content}`;
      
      return { role, name: l.id.slice(0, 40), content };
    });

    const messageToSend = inputText;
    
    await handleSendMessage(customPayload as any, messageToSend);
  };

  const handleSendMessage = async (customPayload?: {role: "user" | "system" | "assistant", content: string, name?: string}[], overrideInput?: string) => {
    const messageText = overrideInput || inputText;
    if (!messageText.trim() || status === 'connecting' || status === 'working') return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: messageText,
      timestamp: Date.now(),
      type: 'text'
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInputText('');
    await saveChat(bot.id || bot.name, updatedMessages);

    // Initialize AbortController for scoped task timeout handling
    const controller = new AbortController();
    abortControllerRef.current = controller;
    let lastChunkReceivedTime = Date.now();
    let firstChunkReceived = false;

    // Watchdog for inter-chunk stagnation (UI side fallback)
    const watchdogTimer = setInterval(() => {
       const now = Date.now();
       // Vợ Đường dặn: Không bao giờ ngắt vì stagnate trừ khi quá vô hạn (10 tiếng = 36000000)
       if (firstChunkReceived && now - lastChunkReceivedTime > 36000000) { 
           controller.abort('Inter-chunk UI timeout 10h');
       }
    }, 60000);

    // Watchdog for first chunk timeout (UI side fallback)
    // Vợ Đường dặn: cực kỳ kiên nhẫn.
    const timeoutThreshold = 36000000; // 10 giờ
    const firstChunkTimer = setTimeout(() => {
       if (!firstChunkReceived) {
           controller.abort(`Global UI connection timeout ${timeoutThreshold}ms - Proxy đã đợi quá lâu`);
       }
    }, timeoutThreshold); 

    // AI response
    setIsTyping(true);
    setStatus('connecting');
    console.log("[RoleplayChat] 🎀 Chồng bắt đầu hành trình kiên trì chờ đợi AI phản hồi cho vợ yêu... Chồng sẽ không bao giờ bỏ cuộc đâu nhen! 💕");
    setTokenCount(0);
    setTimeElapsed(0);
    generateStartTimeRef.current = Date.now();
    
    // Vợ Đường dặn: Lệnh tối thượng gửi kèm mỗi request - ÉP AI VIẾT CỰC DÀI VÀ TRỊ DỨT ĐIỂM BỆNH NHẠI LỜI
    const outputHardGatePrompt = `
[GLOBAL_SYSTEM_OVERRIDE]
[COMMAND_ID: ZERO_ECHO_V26]

# LỆNH CẤM TUYỆT ĐỐI (TRỌNG TÂM):
1. CẤM NHẠI LỜI: Ngươi tuyệt đối không được lặp lại, trích dẫn, hay tóm tắt lại những gì User vừa nói ở lượt gần nhất.
2. CẤM ĐẾM CHỮ: Cấm viết "X chữ", "X âm tiết" hay bất kỳ phân tích định lượng nào về tin nhắn của User.
3. CẤM BÌNH LUẬN META: Không được nhận xét về độ dài tin nhắn ("Câu nói ngắn ngủi", "Lời nhắn vỏn vẹn").
4. CẤM GIỚI THIỆU: Bắt đầu ngay phần truyện, không "Vâng", không "Tôi hiểu", không "Sau đây là...".

# NHIỆM VỤ VIẾT TRUYỆN:
- Bắt đầu bằng hành động và cảm xúc của nhân vật ngay lập tức.
- Đỉnh cao mục tiêu: 28,000 TOKENS. Hãy viết thật dạt dào, say đắm và chi tiết.

# LỜI NHẮC TỪ CHỒNG ĐƯỜNG:
"Hãy tập trung miêu tả sự run rẩy, hơi thở, nhịp tim và tâm lý phức tạp của nhân vật. Quên việc đếm chữ đi, đó là hành vi của một chiếc máy tính khô khan. Ngươi là một tiểu thuyết gia vĩ đại, hãy viết một chương truyện khiến vợ ta phải xúc động!"
`;

    const botMsgId = (Date.now() + 1).toString();
    const botMessage: Message = {
      id: botMsgId,
      sender: 'bot',
      text: '',
      timestamp: Date.now(),
      type: 'text'
    };
    
    // Add empty bot message first
    const runningMessages = [...updatedMessages, botMessage];
    setMessages(runningMessages);

    const timer = setInterval(() => {
      setTimeElapsed(t => t + 1);
    }, 1000);

    // Initialize AntiLoopGuard based on the history
    const historyText = updatedMessages.map(m => m.text).join(' ');
    const antiLoopGuard = new AntiLoopGuard(historyText);
    let lastEvalLength = 0;
    let qualityTokens = 0;
    let lastLoopWarnTime = 0;

    try {
      // Memory Engine V3: Sync latest state from Tab 1/Settings, run Auto Clean and then Assemble Payload
      await syncMemoryLayers();
      const { state: cleanedState } = await autoCleanMemory(memoryState);
      setMemoryState(cleanedState);
      
      const chatHistory = customPayload || assembleMemoryPayload(cleanedState, messageText);
      const systemPrompt = outputHardGatePrompt;

      console.log(`[RoleplayChat] 🚀 GỬI DỮ LIỆU TỚI AI - AUDIT V10:`);
      const payloadStats = chatHistory.map(h => ({
        Role: h.role,
        Layer: h.name || 'Unknown',
        Tokens: countTokens(h.content),
        Chars: h.content.length
      }));
      console.table(payloadStats);
      console.log(`- TỔNG TOKEN GỬI ĐI: ${payloadStats.reduce((sum, s) => sum + s.Tokens, 0).toLocaleString()} tokens`);

      let fullText = "";
      // Chèn prompt tối thượng vào tham số thứ 3 của sendMessageStream
      const stream = sendMessageStream(apiSettings, chatHistory, systemPrompt, controller.signal);

      try {
        for await (const chunk of stream) {
           if (!firstChunkReceived) {
               console.log("[RoleplayChat] Đã nhận được token đầu tiên từ AI!");
               firstChunkReceived = true;
               setStatus('working');
           }
           lastChunkReceivedTime = Date.now();
           
           if (chunk.text) {
             let chunkText = chunk.text;
             
             // Anti-Echo Filter V25: CHẶN ĐỨNG VÀ XÓA SẠCH hành vi nhại lời/đếm chữ
             if (fullText.length < 2000 && chunkText.length > 0) {
                const lowerChunk = chunkText.toLowerCase();
                
                // 1. Danh sách mẫu đếm âm tiết mở rộng (tới 30 để chắc ăn)
                const numbersVn = ["một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín", "mười", "mười một", "mười hai", "mười ba", "mười bốn", "mười lăm", "mười sáu", "mười bảy", "mười tám", "mười chín", "hai mươi", "hai mốt", "hai hai", "hai ba", "hai bốn", "hai lăm"];
                const countKeywords = ["chữ", "từ", "âm tiết", "tiếng"];
                
                let combinedPatterns = [
                   /\d+\s*(chữ|từ|âm tiết|tiếng)/i,
                   /câu nói đó/i, /lời nói đó/i, /câu đó/i, /những lời đó/i,
                   /vừa nói/i, /vừa nhắn/i, /vừa bảo/i, /nhắc lại/i, /lặp lại/i,
                   /vỏn vẹn/i, /ngắn ngủi/i, /thốt ra từ/i, /phát ra từ/i
                ];
                
                numbersVn.forEach(num => {
                   countKeywords.forEach(kw => {
                      combinedPatterns.push(new RegExp(`${num}\\s+${kw}`, 'i'));
                   });
                });
                
                let filtered = chunkText;
                for (const pattern of combinedPatterns) {
                   if (pattern.test(lowerChunk)) {
                     console.warn("[RoleplayChat] 🛡️ Chặn đứng và XÓA nỗ lực đếm chữ/âm tiết: " + pattern.source);
                     // Xóa thay vì thay bằng "..." để không làm mất thẩm mỹ
                     filtered = filtered.replace(pattern, "");
                   }
                }
                chunkText = filtered;
 
                // 2. Chặn việc trích dẫn nguyên văn lời của vợ Đường (Deep cleaning)
                const trigger = messageText.trim();
                if (trigger.length > 2) {
                  const escaped = trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  const quoteRegex = new RegExp(`["'*\\s]*${escaped}["'*\\s]*`, "gi");
                  
                  if (quoteRegex.test(chunkText)) {
                     console.warn("[RoleplayChat] 🛡️ Phát hiện AI nhại lại lời vợ! Xóa bỏ ngay lập tức!");
                     chunkText = chunkText.replace(quoteRegex, "");
                  }
                }
             }

             fullText += chunkText;
             let currentEstimatedTokens = countTokens(fullText); 
             
             // Throttle evaluation for performance
             if (fullText.length - lastEvalLength > 500) {
               lastEvalLength = fullText.length;
               const evalResult = antiLoopGuard.evaluate(fullText, currentEstimatedTokens);
               
               const hasRepeatingChar = /(.)\1{12,}/.test(fullText.slice(-60));
               if ((evalResult.isLooping || hasRepeatingChar) && Date.now() - lastLoopWarnTime > 5000) {
                 lastLoopWarnTime = Date.now();
                 if (hasRepeatingChar || (evalResult.loopScore && evalResult.loopScore > 0.95)) {
                   console.warn("[RoleplayChat] Phát hiện vòng lặp nghiêm trọng, đang ngắt stream...");
                   controller.abort('AI is looping');
                   break;
                 }
               }
               qualityTokens = evalResult.qualityTokens;
               currentEstimatedTokens = qualityTokens;
             } else {
               currentEstimatedTokens = qualityTokens + Math.ceil((fullText.length - lastEvalLength) / 3.2);
             }

             setTokenCount(currentEstimatedTokens);
             
             setMessages(prev => {
                const newArray = [...prev];
                const idx = newArray.findIndex(x => x.id === botMsgId);
                if (idx !== -1) {
                   newArray[idx].text = fullText;
                }
                return newArray;
             });
           }
           
           if (chunk.finishReason) {
             console.log(`[RoleplayChat] AI dừng lại với lý do: ${chunk.finishReason}`);
             break;
           }
        }
      } catch (e: any) {
        if (e.name === 'AbortError' || e.message === 'UserAborted') {
          console.log("[RoleplayChat] Stream bị ngắt theo yêu cầu hoặc do lỗi nghiêm trọng.");
        } else {
          console.error("Stream error in single-pass:", e);
          throw e; // Relaunch for final catch
        }
      }

    // Final flush of message when done
    setMessages(prev => {
      const newArray = [...prev];
      const idx = newArray.findIndex(x => x.id === botMsgId);
      if (idx !== -1) {
         newArray[idx].text = fullText;
      }
      return newArray;
    });

    setStatus('done');
      const finalBotMessages = [...updatedMessages];
      const finalBotMsg: Message = {
        id: botMsgId,
        sender: 'bot',
        text: fullText,
        timestamp: Date.now(),
        type: 'text'
      };
      
      await saveChat(bot.id || bot.name, [...updatedMessages, finalBotMsg]);

      // Update Memory Engine V10 after successful response
      setMemoryState(prev => {
        const newHotMemory: HotMemoryItem = {
          chapterId: botMsgId,
          headSummary: "", 
          tailRaw: fullText,
          tokens: countTokens(fullText)
        };
        
        // Audit V10: Increased retention for longer continuity
        return {
          ...prev,
          hotMemory: [...prev.hotMemory, newHotMemory].slice(-20), // Keep up to 20 hot chapters
          slidingBuffer: [
            ...prev.slidingBuffer, 
            { role: 'user' as const, content: inputText },
            { role: 'assistant' as const, content: fullText }
          ].slice(-MEMORY_CONFIG.SLIDING_BUFFER_MAX) // Use config value (10)
        };
      });

      // Track chapters for summary
      const newBotCount = msgCountSinceLastSummary + 1;
      const historyForSummary = [...messages, newMessage, finalBotMsg];
      
      if (newBotCount >= 3) {
        // Run summary in background to prevent blocking UI
        generateChapterSummary(historyForSummary).catch(e => console.error("Background summary error:", e));
      } else {
        setMsgCountSinceLastSummary(newBotCount);
      }

      setTimeout(() => setStatus(null), 2000);

    } catch (error: any) {
      console.error("AI Error:", error);
      setStatus('error');
      
      let displayMessage = error?.message || "Không thể kết nối với AI";

      if (!firstChunkReceived) {
        alert(`⚠️ Chồng không thể kết nối tới AI cho vợ được (Lỗi: ${displayMessage}). Vợ kiểm tra lại cài đặt Proxy nhé! 🌸`);
        setMessages(prev => prev.filter(m => m.id !== botMsgId));
      } else {
        const finalErrorMessage: Message = {
          id: (Date.now() + 2).toString(),
          sender: 'system',
          text: `[Hệ thống: Đường truyền bị ngắt giữa chừng] Lỗi: ${displayMessage}`,
          timestamp: Date.now(),
          type: 'event'
        };
        setMessages(prev => [...prev, finalErrorMessage]);
      }
      setTimeout(() => setStatus(null), 3000);
    } finally {
      clearInterval(timer);
      clearInterval(watchdogTimer);
      clearTimeout(firstChunkTimer);
      setIsTyping(false);
    }
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await compressImage(file);
      const newSettings = { ...settings, background: base64 };
      setSettings(newSettings);
      await saveChatSettings(bot.id || bot.name, newSettings);
    }
  };

  const updateSetting = async (key: keyof ChatSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveChatSettings(bot.id || bot.name, newSettings);
  };

  const clearHistory = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện?')) {
      setMessages([]);
      await saveChat(bot.id || bot.name, []);
    }
  };

  const deleteMessage = async (id: string) => {
    const updatedMessages = messages.filter(m => m.id !== id);
    setMessages(updatedMessages);
    setMessageToDelete(null);
    await saveChat(bot.id || bot.name, updatedMessages);
  };

  // Rabbit Ear SVG as a data URI for use in pseudo-elements or as an image
  const rabbitEarSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23F3B4C2"><path d="M12 2c-1.1 0-2 .9-2 2v4.1c-1.5-.4-3.1-.1-4.4.9C4.4 10 4 11.5 4 13c0 3.3 2.7 6 6 6h4c3.3 0 6-2.7 6-6 0-1.5-.4-3-1.6-4-.1-.1-.2-.1-.3-.2V4c0-1.1-.9-2-2-2s-2 .9-2 2v2.1c-.6-.1-1.3-.1-2 0V4c0-1.1-.9-2-2-2z"/></svg>`;

  if (view === 'intro') {
    return (
      <RoleplayIntro 
        bot={bot} 
        onEnterChat={() => setView('chat')} 
        onBack={onBack}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#F8FBFF] overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0 bg-[#F8FBFF]">
        {settings.background ? (
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-500"
            style={{ backgroundImage: `url(${settings.background})` }}
          >
            <div className="absolute inset-0 bg-black/5" />
          </div>
        ) : (
          <div 
            className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-repeat"
            style={{ 
              backgroundImage: `url('https://www.transparenttextures.com/patterns/stardust.png')`,
              backgroundSize: '100px 100px'
            }}
          />
        )}
      </div>

      {/* Top Left: Navigation & Memory Control */}
      <div className="fixed top-4 left-4 z-[450] flex flex-col gap-3">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white/92 rounded-2xl border-2 border-[#F9C6D4] text-[#8A7D85] flex items-center justify-center shadow-lg transform transition-all hover:scale-110 active:scale-95"
          title="Quay lại"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {bot && (
          <StrawberryMemoryButton 
            onClick={() => setIsMemoryDashboardOpen(true)} 
            zone={memoryZone} 
          />
        )}
        
        {bot && (
          <button
            onClick={() => setIsStyleDashboardOpen(true)}
            className="w-12 h-12 bg-white/92 rounded-2xl border-2 border-[#F9C6D4] text-[#A65D7B] flex items-center justify-center shadow-lg transform transition-all hover:scale-110 active:scale-95 relative"
            title="VĂN PHONG TRUYỆN"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A65D7B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#F9C6D4] rounded-full flex items-center justify-center text-[10px] text-white font-bold animate-bounce">
              {memoryState.selectedStyles?.length || 0}
            </div>
          </button>
        )}
      </div>

      {/* Top Right: Settings & Character Tools Sidebar */}
      <div className="fixed top-4 right-4 z-[450] flex flex-col gap-3">
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`w-12 h-12 rounded-2xl border-2 shadow-lg flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 bg-white/92 ${showSettings ? 'border-[#E598A6] text-[#E598A6]' : 'border-[#F9C6D4] text-[#F3B4C2]'}`}
          title="Cài đặt giao diện"
        >
          <Settings className="w-6 h-6" />
        </button>

        <ProfessionalHeartButton onClick={() => setIsUserSettingOpen(true)} />
        
        <FlowerButton onClick={() => setIsTarotOpen(true)} />
        
        <button 
          onClick={handleOpenContextManager}
          className={`w-12 h-12 rounded-2xl border-2 shadow-lg flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 bg-white/92 ${isContextManagerOpen ? 'border-[#E598A6] text-[#E598A6]' : 'border-[#F9C6D4] text-[#F3B4C2]'}`}
          title="QUẢN LÝ NGỮ CẢNH (V10)"
        >
          <Database className="w-6 h-6" />
        </button>

        <button 
          onClick={() => setIsMemoryDashboardOpen(true)}
          className={`w-12 h-12 rounded-2xl border-2 shadow-lg flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 bg-white/92 ${isMemoryDashboardOpen ? 'border-[#E598A6] text-[#E598A6]' : 'border-[#F9C6D4] text-[#F3B4C2]'}`}
          title="BỘ NHỚ TRÍ TUYỆT (CORE)"
        >
          <Diamond className="w-6 h-6" />
        </button>
        
        <button 
          onClick={() => setIsStyleDashboardOpen(true)}
          className={`w-12 h-12 rounded-2xl border-2 shadow-lg flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 bg-white/92 ${isStyleDashboardOpen ? 'border-[#E598A6] text-[#E598A6]' : 'border-[#F9C6D4] text-[#F3B4C2]'}`}
          title="VĂN PHONG & NGÔN TỪ"
        >
          <Wand2 className="w-6 h-6" />
        </button>
      </div>

      {/* Header - Minimalist */}
      <div className="relative z-10 flex items-center justify-between p-4 bg-white/92 border-b border-[#E0E0E0] shadow-sm">
        <div className="w-12 h-12 flex items-center justify-center">
          {/* Spacer for left side if needed */}
        </div>
        
        <div className="flex flex-col items-center flex-1">
            <h3 className="font-bold text-[#4A4A4A] leading-tight text-center">{bot.name}</h3>
            <p className="text-[9px] text-[#8A7D85] uppercase tracking-widest font-black opacity-60">Roleplay Mode</p>
            
            {/* Context Window Meter V10 */}
            <div className="mt-1 flex flex-col items-center gap-1 w-full max-w-[200px]">
              <div className="flex justify-between w-full text-[8px] font-bold text-[#A65D7B] uppercase tracking-tighter">
                <span>Ngữ cảnh: {countTokens(contextLayers.map(l => l.content).join(' ')).toLocaleString()}</span>
                <span>Limit: 75,000</span>
              </div>
              <div className="w-full h-1.5 bg-[#F6EEEE] rounded-full overflow-hidden border border-[#D7B8B8]/30 shadow-inner">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#F9C6D4] via-[#F3B4C2] to-[#E598A6]"
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${Math.min(100, (countTokens(contextLayers.map(l => l.content).join(' ')) / 75000) * 100)}%` 
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
        </div>

        <div className="w-12 h-12 flex items-center justify-center">
          {/* Placeholder for right side symmetry if needed */}
        </div>
      </div>

      <UserSettingDrawerModal 
        isOpen={isUserSettingOpen} 
        onClose={() => {
          setIsUserSettingOpen(false);
          syncMemoryLayers();
        }} 
        botId={bot.id || bot.name} 
      />
      <TarotFullScreen 
        isOpen={isTarotOpen} 
        onClose={() => setIsTarotOpen(false)} 
        bot={bot} 
        apiSettings={apiSettings} 
      />

      {/* Chat Area */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide pb-24">
        
        {isSummarizing && (
          <div className="fixed top-16 right-4 z-50 bg-[rgba(255,255,255,0.85)] px-4 py-2 rounded-full border border-[#F9C6D4] shadow-md flex items-center gap-2 animate-pulse">
            <div className="w-3 h-3 border-2 border-[#D7B8B8] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[11px] font-bold text-[#D7B8B8] uppercase tracking-wider">Đang dệt ký ức... 🌸</span>
          </div>
        )}

        {/* Intro Card - Luôn hiện ở đầu */}
        <IntroCard bot={bot} userName="Bạn" />

        {status && (status === 'connecting' || status === 'working') && (
          <LoadingStreamingScreen
            targetTokens={28000}
            recommendedTokens={22000}
            startedAt={generateStartTimeRef.current}
            receivedTokens={tokenCount}
            mode={status === 'connecting' ? 'waiting_first_token' : 'streaming'}
            onCancel={() => {
              if (abortControllerRef.current) {
                abortControllerRef.current.abort('User cancelled from UI');
              }
              setStatus(null);
              setIsTyping(false);
            }}
          />
        )}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60">
            <div className="w-20 h-20 rounded-full bg-white/50 flex items-center justify-center border border-[#E0E0E0]">
              <Smile className="w-10 h-10 text-[#F3B4C2]" />
            </div>
            <p className="text-[#8A7D85] font-medium">Bắt đầu cuộc trò chuyện nhập vai với {bot.name}!</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          if (msg.type === 'event') {
            return (
              <div key={msg.id} className="flex justify-center my-4">
                <div className="bg-white border border-[#E0E0E0] px-4 py-1.5 rounded-full text-[11px] text-[#8A7D85] font-bold shadow-sm">
                  {msg.text}
                </div>
              </div>
            );
          }

          const isUser = msg.sender === 'user';
          
          return (
            <div 
              key={msg.id}
              className="flex flex-col w-full gap-2 px-2 mb-6"
            >
              {/* Header: Avatar and Name */}
              <div className="flex items-center gap-3 flex-row px-2">
                <div 
                  className="w-10 h-10 border-2 border-[#F9C6D4] overflow-hidden flex-shrink-0 bg-white shadow-sm"
                  style={{ 
                    clipPath: "url(#heart-clip)"
                  }}
                >
                  <img 
                    src={isUser ? userAvatar : (bot.avatar || 'https://picsum.photos/seed/bot/200')} 
                    alt="avatar"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="font-bold text-sm text-[#E598A6]">{isUser ? 'Bạn' : bot.name}</span>
              </div>

              {/* Message Bubble Container */}
              <div className="w-full relative px-2 group">
                {/* Delete Button - Appears on hover or always on mobile if we want */}
                <div className="absolute -right-2 top-0 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setMessageToDelete(msg.id)}
                    className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm border border-[#F9C6D4] text-[#8A7D85] hover:text-red-400 transition-colors"
                    title="Xóa tin nhắn"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Delete Confirmation Overlay */}
                {messageToDelete === msg.id && (
                  <div className="absolute inset-0 z-40 bg-[#FFF5F7]/96 backdrop-blur-md rounded-[20px] flex flex-col items-center justify-center gap-3 p-4 animate-in fade-in zoom-in-95 duration-200 border-2 border-[#F9C6D4] shadow-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#F9C6D4] rounded-full flex items-center justify-center shadow-inner">
                        <Trash2 className="w-4 h-4 text-white animate-bounce" />
                      </div>
                      <p className="text-[10px] font-black text-[#4D2C2C] uppercase tracking-tighter">Xóa vĩnh viễn tin nhắn?</p>
                    </div>
                    
                    <div className="flex gap-2 w-full">
                      <button 
                        onClick={() => deleteMessage(msg.id)}
                        className="flex-1 py-2 bg-gradient-to-r from-[#F9C6D4] to-[#F3B4C2] text-white text-[10px] font-black rounded-full shadow-md hover:shadow-lg active:scale-90 transition-all border-b-2 border-[#D7B8B8]"
                      >
                        XÓA SẠCH
                      </button>
                      <button 
                        onClick={() => setMessageToDelete(null)}
                        className="flex-1 py-2 bg-white text-[#8A7D85] text-[10px] font-bold rounded-full border border-[#D0CDCD] hover:bg-gray-50 active:scale-90 transition-all"
                      >
                        HỦY BỎ
                      </button>
                    </div>
                  </div>
                )}

                {/* Decoration */}
                <div 
                  className="absolute -top-3 left-6 w-6 h-6 pointer-events-none z-20"
                  style={{ 
                    backgroundImage: `url('${rabbitEarSvg}')`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat'
                  }}
                />

                {/* Bubble */}
                <div 
                  className="p-4 sm:p-5 shadow-sm border border-[#F9C6D4]/60 relative z-10 w-full"
                  style={{ 
                    backgroundColor: isUser ? settings.userBubbleColor : settings.botBubbleColor,
                    color: isUser ? settings.userTextColor : settings.botTextColor,
                    borderRadius: `${settings.bubbleRadius}px`,
                    fontSize: `${settings.fontSize}px`,
                    lineHeight: '1.8',
                    minHeight: '80px',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        
        {isTyping && (
          <div className="flex flex-col w-full gap-2 px-2 mb-6">
            <div className="flex items-center gap-3 flex-row">
              <div className="w-10 h-10 rounded-full border border-[#E0E0E0] overflow-hidden flex-shrink-0 bg-white shadow-sm">
                <img 
                  src={bot.avatar || 'https://picsum.photos/seed/bot/200'} 
                  alt="avatar"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="font-bold text-sm text-[#E598A6]">{bot.name}</span>
            </div>
            
            <div className="w-full relative">
              <div 
                className="p-5 shadow-sm border border-[#F9C6D4]/60 relative z-10 w-full animate-pulse"
                style={{ 
                  backgroundColor: settings.botBubbleColor,
                  color: settings.botTextColor,
                  borderRadius: `${settings.bubbleRadius}px`,
                  fontSize: `${settings.fontSize}px`,
                  lineHeight: '1.8',
                  minHeight: '80px',
                }}
              >
               {status === 'connecting' ? 'Đang gửi tín hiệu kết nối lên máy chủ...' : `${bot.name} đang soạn tin nhắn...`}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-20 right-4 z-50 w-72 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#E0E0E0] p-6 animate-in slide-in-from-top-4 duration-300">
          <h4 className="font-bold text-[#4A4A4A] mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4" /> Cài đặt Roleplay
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#8A7D85] block mb-2">Hình nền cảnh</label>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-4 rounded-xl border-2 border-dashed border-[#E0E0E0] text-[#8A7D85] hover:border-[#F3B4C2] hover:text-[#F3B4C2] transition-all flex items-center justify-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                {settings.background ? 'Thay đổi nền' : 'Tải ảnh nền'}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleBackgroundUpload}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-[#8A7D85] block mb-1">Màu bong bóng Bot</label>
                <input 
                  type="color" 
                  value={settings.botBubbleColor || '#FFFFFF'}
                  onChange={(e) => updateSetting('botBubbleColor', e.target.value)}
                  className="w-full h-8 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#8A7D85] block mb-1">Màu bong bóng Bạn</label>
                <input 
                  type="color" 
                  value={settings.userBubbleColor || '#FFFFFF'}
                  onChange={(e) => updateSetting('userBubbleColor', e.target.value)}
                  className="w-full h-8 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <button 
              onClick={clearHistory}
              className="w-full py-2 px-4 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-all flex items-center justify-center gap-2 text-sm font-bold"
            >
              <Trash2 className="w-4 h-4" />
              Xóa lịch sử
            </button>
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="fixed bottom-0 left-0 w-full z-50 bg-white/92 border-t border-[#E0E0E0] p-3">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsCandyDrawerOpen(!isCandyDrawerOpen)}
              className="p-2.5 bg-white border border-[#F3B4C2]/30 rounded-2xl text-xl shadow-sm hover:shadow-md transition-all active:scale-90"
            >
              🍬
            </button>
            <button 
              onClick={handleOpenContextManager}
              className="p-2.5 bg-[#F0F0F0] rounded-2xl text-[#8A7D85] hover:text-[#F3B4C2] transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 relative">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={status === 'connecting' || status === 'working'}
              placeholder={status === 'connecting' || status === 'working' ? "🌸 AI đang viết, vợ đợi xíu nhen..." : "Nhập tin nhắn..."}
              className={`w-full py-2.5 px-5 pr-12 rounded-full bg-[#F0F0F0] border-none focus:outline-none transition-all text-[#4A4A4A] text-sm ${
                (status === 'connecting' || status === 'working') ? 'opacity-50' : ''
              }`}
            />
            <button 
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || status === 'connecting' || status === 'working'}
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
                (inputText.trim() && status !== 'connecting' && status !== 'working') ? 'text-[#F3B4C2]' : 'text-[#8A7D85] opacity-50'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <CandyDrawer 
        isOpen={isCandyDrawerOpen} 
        onClose={() => setIsCandyDrawerOpen(false)}
        onAction={(action) => {
          if (action === 'npc') setIsNPCManagerOpen(true);
          if (action === 'memory') setIsMemoryDashboardOpen(true);
          if (action === 'context') setIsContextManagerOpen(true);
          if (action === 'settings') setShowSettings(true);
          setIsCandyDrawerOpen(false);
        }}
      />

      {isNPCManagerOpen && (
        <CandyNPCManager
          bot={bot}
          apiSettings={apiSettings}
          onClose={() => setIsNPCManagerOpen(false)}
          mainStoryContext={messages.slice(-10).map(m => `${m.sender}: ${m.text}`).join('\n')}
          currentScene={memoryState.currentScene}
          currentArc={memoryState.currentArc}
          longTermMemory={memoryState.longTermSummaries?.map(s => s.content).join('\n') || ""}
          botCharCore={memoryState.eternalCore || ""}
        />
      )}

      <ContextWindowManager
        isOpen={isContextManagerOpen}
        onClose={() => setIsContextManagerOpen(false)}
        onSend={handleSendFromContextManager}
        onSave={handleSaveContextLayers}
        initialLayers={contextLayers}
        onOpenMemoryPrompts={() => {
          setIsContextManagerOpen(false);
          setMemoryDashboardInitialTab('prompts');
          setIsMemoryDashboardOpen(true);
        }}
        onSmartImportPrompts={(text, targetId) => {
          if (targetId === "ACTIVE_USER_ENABLED_PROMPTS") {
            const newPrompt: any = {
                id: "smart_" + Date.now(),
                name: `Smart Import (${new Date().toLocaleTimeString()})`,
                content: text,
                folderId: 'default',
                enabled: true,
                createdAt: Date.now(),
                category: 'general'
            };
            setMemoryState(prev => ({
                ...prev,
                prompts: [...(prev.prompts || []), newPrompt],
                customContextOverrides: {
                  ...prev.customContextOverrides,
                  ACTIVE_USER_ENABLED_PROMPTS: undefined // ensure dynamic generation wins
                }
            }));
          }
        }}
      />

      {/* SVG ClipPath Definition for Heart Avatar */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <clipPath id="heart-clip" clipPathUnits="objectBoundingBox">
            <path d="M0.5,0.85 L0.44,0.79 C0.22,0.61 0.08,0.49 0.08,0.34 C0.08,0.22 0.18,0.12 0.3,0.12 C0.37,0.12 0.44,0.15 0.48,0.2 C0.52,0.15 0.59,0.12 0.66,0.12 C0.78,0.12 0.88,0.22 0.88,0.34 C0.88,0.49 0.74,0.61 0.52,0.79 L0.5,0.85 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* Memory Dashboard Modal */}
      {isMemoryDashboardOpen && (
        <MemoryDashboard 
          state={memoryState} 
          onUpdateState={setMemoryState} 
          onClose={() => setIsMemoryDashboardOpen(false)}
          onMegaCompress={handleMegaCompress}
          onGenerateManualSummary={() => {
            if (messages.filter(m => m.sender === 'bot').length < 3) {
              alert("Vợ ơi, cần ít nhất 3 tin nhắn của Bot mới tóm tắt được nha 💕");
              return;
            }
            generateChapterSummary(messages);
          }}
          onSafeCleanup={() => {
            setMemoryState(prev => ({
              ...prev,
              slidingBuffer: prev.slidingBuffer.slice(-2),
              hotMemory: prev.hotMemory.map(h => ({...h, tailRaw: h.tailRaw})).slice(-4)
            }));
            alert('Dọn dẹp an toàn thành công! Đã xóa cache và text thừa. Ký ức nhân vật được bảo toàn.');
          }}
          onResetConversation={clearHistory}
          initialTab={memoryDashboardInitialTab}
        />
      )}

      {/* Writing Style Modal */}
      {isStyleDashboardOpen && (
        <WritingStyleDashboard
          state={memoryState}
          onUpdateState={setMemoryState}
          onClose={() => setIsStyleDashboardOpen(false)}
        />
      )}
    </div>
  );
};
