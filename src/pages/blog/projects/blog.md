# Building CallKaro: A Voice AI Agent That Calls Indian Shops and Negotiates Prices in Hindi

*How we built a full-stack voice pipeline that researches products, finds local stores, calls them over the phone, haggles in Romanized Hindi, and compares quotes -- all autonomously.*

---

In India, if you want to buy an air conditioner, a washing machine, or a refrigerator, you do not go to a website and click "Add to Cart." You call three or four local dealers, ask for their best price, mention that the shop down the road offered you less, and eventually settle on a number. This ritual plays out millions of times a day across the country, entirely over the phone, entirely in Hindi.

We built CallKaro to automate that ritual. It is a voice AI agent that calls real shops, speaks Hindi, asks about prices, pushes back gently on high quotes, and compares results across stores. This post covers how it works, what broke along the way, and the technical decisions that made it possible.

## The Problem: Prices Live in Phone Calls, Not on Websites

Three realities define consumer electronics retail in India:

**Local dealers do not list prices online.** Walk into any appliance market -- Lajpat Rai in Delhi, SP Road in Bangalore, Lamington Road in Mumbai -- and you will find hundreds of shops. Almost none of them publish prices. The price depends on who is asking, what day it is, and how much inventory they have.

**Negotiation is expected.** The first price a shopkeeper quotes is never the final price. Buyers are expected to push back. Mentioning a competitor's quote, asking about bundled installation, or simply saying "thoda zyada lag raha hai" (seems a bit high) can shave thousands of rupees off. This negotiation happens conversationally, in Hindi, and it requires cultural fluency.

**Hindi-first market.** Over 600 million people in India speak Hindi. In Tier 2 and Tier 3 cities, most shopkeepers conduct business exclusively in Hindi or the local language. A price enquiry system that only works in English misses the majority of the market.

CallKaro addresses all three: it makes real phone calls, negotiates in natural Hindi, and aggregates results across multiple shops into a structured comparison.

## Architecture: From "I Want an AC" to a Price Comparison Table

The system is a five-stage pipeline. A user says what they want to buy and where they live. CallKaro researches the product, finds nearby stores, calls each one, and presents a ranked comparison.

```
[DIAGRAM: End-to-end pipeline]

  User Input          Research            Store Discovery
  +-----------+      +-------------+      +------------------+
  | "I want a | ---> | LLM + Web   | ---> | Google Maps      |
  |  1.5 ton  |      | Search      |      | scraping + Web   |
  |  split AC |      | (pricing,   |      | search for phone |
  |  in Kormn |      |  models,    |      | numbers & nearby |
  |  -gala"   |      |  negotiate  |      | stores           |
  +-----------+      |  tactics)   |      +------------------+
                     +-------------+               |
                                                   v
                                          +------------------+
  Cross-Store         Voice Calling       | Store 1: Croma   |
  Analysis            (per store)         | Store 2: Pai     |
  +-----------+      +-------------+      | Store 3: Local   |
  | LLM ranks | <--- | LiveKit     | <--- +------------------+
  | stores by  |      | WebRTC room |
  | total cost |      | + SIP trunk |
  | + extras   |      | to phone    |
  +-----------+      +-------------+
```

**Stage 1: Intake.** A chat interface powered by an LLM extracts structured requirements -- product type, capacity, budget range, location, any brand preferences. "I want a 1.5 ton split AC around 35-40K in Koramangala" becomes `{product_type: "AC", category: "1.5 ton 5-star inverter split AC", budget_range: [35000, 40000], location: "Koramangala, Bangalore"}`.

**Stage 2: Research.** The LLM searches the web for current market prices, competing models, typical dealer margins, seasonal pricing patterns, and negotiation tactics. This intelligence gets injected into the voice agent's system prompt so it knows what a fair price looks like and can push back credibly.

**Stage 3: Store Discovery.** Google Maps scraping and web search find nearby electronics stores, their phone numbers, ratings, and reviews. The system recommends stores with good ratings and known inventory.

**Stage 4: Voice Calling.** For each selected store, CallKaro spins up a LiveKit WebRTC room, dispatches a voice agent, and dials the store over SIP. The agent speaks in Romanized Hindi, asks about price, warranty, installation, delivery, and exchange, negotiates gently, and hangs up once it has enough information.

**Stage 5: Cross-Store Analysis.** After all calls complete, the transcripts are fed to an LLM that extracts structured price/warranty/installation data and ranks the stores by total estimated cost.

## The Voice Agent Stack: VAD to TTS

The voice agent is where the most interesting engineering lives. Here is the signal flow for a single conversational turn:

```
[DIAGRAM: Voice agent signal path]

  Phone Audio In                              Phone Audio Out
  (shopkeeper)                                (to shopkeeper)
       |                                           ^
       v                                           |
  +---------+    +----------+    +---------+    +--------+
  | Silero  | -> | Sarvam   | -> | Claude  | -> | Sarvam |
  | VAD     |    | STT      |    | Haiku   |    | TTS    |
  | (voice  |    | saaras   |    | 4.5     |    | bulbul |
  | detect) |    | :v3      |    |         |    | :v3    |
  +---------+    | (Hindi)  |    +---------+    | (Hindi)|
       |         +----------+         |         +--------+
       |              |               |              |
       v              v               v              v
  min_speech     "Adtees hazaar   "Achha, 38000.  "achha,
   80ms           ka hai"         Installation     untaalees
  min_silence                     free hai kya?"    hazaar..."
   800ms                               |
                                       v
                              +------------------+
                              | Normalization    |
                              | Layer            |
                              | - Number buffer  |
                              | - Hindi numbers  |
                              | - Devanagari     |
                              |   transliterate  |
                              | - Strip markers  |
                              +------------------+
```

**VAD (Silero):** Detects when someone is speaking. We tuned `min_speech_duration` to 80ms to filter noise bursts while keeping it responsive, and `min_silence_duration` to 800ms so the agent waits a beat before assuming the shopkeeper has finished talking.

**STT (Sarvam saaras:v3):** Converts Hindi speech to text. Sarvam's model handles Hindi, Hinglish (Hindi-English code-switching), and background noise reasonably well. The output comes as English-transliterated text -- "Adtees hazaar ka hai" rather than Devanagari script.

**LLM (Claude Haiku 4.5):** The brain. Receives the shopkeeper's transcribed speech and generates the next response in Romanized Hindi. The system prompt is heavily engineered -- more on that below.

**Normalization Layer:** Sits between the LLM and TTS. This is where most of our bugs lived. It handles number-to-Hindi-word conversion, Devanagari transliteration, action marker stripping, and spacing fixes.

**TTS (Sarvam bulbul:v3):** Converts Romanized Hindi text to natural-sounding Hindi speech. The "shubh" voice at 8kHz for telephony, 16kHz for browser sessions.

**Turn Detection (Multilingual Model):** A transformer-based model that predicts end-of-utterance using conversation context, running on top of VAD signals. This is critical for Hindi, where pauses mid-sentence are common.

## Technical Challenges: The Bugs That Taught Us the Most

### 1. The Number Splitting Bug

The LLM outputs prices as digits: "38000". Our normalization layer converts this to Hindi words for natural TTS: "adtees hazaar." Simple enough -- until streaming broke it.

LLM responses arrive as token chunks. The number "28000" might arrive as two tokens: `"28"` and `"000"`. If we normalize each chunk independently, we get "attaaees" (28) followed by "zero" -- instead of "attaaees hazaar" (28,000).

The fix is a buffered normalizer that holds trailing digits until the next chunk arrives:

```python
class _NumberBufferedNormalizer:
    """Buffer trailing digits across streaming chunks to prevent
    number splitting.

    Problem: LLM streams "28" + "000" -> "attaaees" + "zero"
    Solution: Hold trailing digits, prepend to next chunk.
    """
    def __init__(self):
        self._buffer = ""

    def process(self, chunk: str) -> str:
        chunk = self._buffer + chunk
        self._buffer = ""

        # If chunk ends with digits, buffer them for the next chunk
        m = re.search(r"(\d+)$", chunk)
        if m:
            self._buffer = m.group(1)
            chunk = chunk[:m.start()]

        if chunk:
            return _normalize_for_tts(chunk)
        return ""

    def flush(self) -> str:
        """Flush remaining buffer at end of stream."""
        if self._buffer:
            result = _normalize_for_tts(self._buffer)
            self._buffer = ""
            return result
        return ""
```

The Hindi number conversion itself covers every number from 0 to 99 with individual words (Hindi does not have a regular tens-and-ones pattern like English), plus compound forms for thousands, lakhs, and crores. It also handles the "saadhe" pattern: 37,500 becomes "saadhe saintees hazaar" (thirty-seven-and-a-half thousand), and 1,500 becomes "dedh hazaar" (one-and-a-half thousand):

```python
if n >= 1000:
    thousands = n // 1000
    remainder = n % 1000
    if remainder == 500:
        if thousands == 1:
            parts.append("dedh hazaar")
        elif thousands == 2:
            parts.append("dhaai hazaar")
        else:
            parts.append("saadhe " + _number_to_hindi(thousands) + " hazaar")
        n = 0  # fully consumed
```

### 2. Character Breaks: The Agent Goes English

Occasionally the LLM would break character entirely -- responding in fluent English instead of Romanized Hindi. This crashed the Hindi TTS, which rejected English text with an "allowed languages" error.

We built a heuristic detector that checks for the presence of common Hindi marker words. If a response longer than 20 characters contains none of them, it is flagged as a character break:

```python
_HINDI_MARKERS = {
    "achha", "ji", "haan", "theek", "kya", "hai", "mein", "nahi",
    "bhai", "aur", "aap", "yeh", "ke", "ka", "ki", "se", "ko",
    "toh", "bahut", "hazaar", "lakh", "namaskar", "namaste",
    "dhanyavaad", "shukriya", "bilkul",
}

def _is_character_break(text: str) -> bool:
    cleaned = text.strip().lower()
    if len(cleaned) <= 20:
        return False
    words = set(re.findall(r"[a-z]+", cleaned))
    return not bool(words & _HINDI_MARKERS)
```

When detected, the system logs a warning and has canned Hindi fallback responses ready. The real defense, though, is the TTS error handler, which catches the downstream crash gracefully rather than killing the call.

### 3. STT Garbage: Noise Becomes Words

In a real phone call, there are long stretches of silence, hold music, background chatter, and line noise. The Sarvam STT model would sometimes transcribe these as random English words -- "table," "the," "and" -- triggering the LLM to respond to phantom input.

We filter these with a simple heuristic: single-word transcripts that match a known set of common STT artifacts get flagged as garbage and logged but not acted upon:

```python
_GARBAGE_PATTERNS = {"table", "the", "and", "a", "an", "it",
                     "is", "to", "of", "i", "in"}

def _is_likely_garbage(text: str) -> bool:
    words = text.strip().rstrip('.!?,').lower().split()
    if not words:
        return True
    if len(words) == 1 and words[0] in _GARBAGE_PATTERNS:
        return True
    return False
```

### 4. Devanagari Leakage

Despite explicit instructions to output only Romanized Hindi in Latin script, the LLM would occasionally leak Devanagari characters. A single Hindi character in the TTS input could cause pronunciation errors or failures.

The safety net is a fast single-pass transliterator that detects and converts any Devanagari to its Romanized equivalent. It handles consonant-matra combinations correctly -- when a Devanagari consonant is followed by a vowel sign (matra), the matra replaces the consonant's inherent "a" vowel:

```python
def _transliterate_devanagari(text: str) -> str:
    # Quick check: skip if no Devanagari present
    if not any('\u0900' <= c <= '\u097F' for c in text):
        return text
    result = []
    i = 0
    while i < len(text):
        ch = text[i]
        if '\u0900' <= ch <= '\u097F':
            roman = _DEVANAGARI_MAP.get(ch, '')
            # Consonant followed by matra: strip inherent 'a'
            if ch in _DEVANAGARI_CONSONANTS and roman.endswith('a'):
                if i + 1 < len(text):
                    next_ch = text[i + 1]
                    if next_ch in _DEVANAGARI_MATRAS or next_ch == '\u094D':
                        roman = roman[:-1]
            result.append(roman)
        else:
            result.append(ch)
        i += 1
    return ''.join(result)
```

### 5. Greeting Duplication

When the agent joins a call, it speaks a greeting: "Hello, yeh Croma hai? AC ke baare mein poochna tha." This greeting is added to the chat context via `session.say(greeting, add_to_chat_ctx=True)` so the LLM sees it as its own first message. The problem: the LLM would then generate the exact same greeting again as its first response, saying hello twice.

The fix was a NOTE injected into the system prompt that tells the LLM it has already spoken:

```
NOTE: You have already greeted the shopkeeper with:
"Hello, yeh Croma hai? AC ke baare mein poochna tha."
Do NOT repeat the greeting. Continue the conversation from
the shopkeeper's response.
```

The greeting text in the NOTE must exactly match the actual spoken greeting built by `build_greeting()`. Any mismatch and the LLM does not recognize it as its own words.

### 6. TTS Sentence Splitting and Leading Spaces

We discovered that the Sarvam TTS engine uses whitespace patterns to split text into sentences for prosody. When our normalization layer called `.strip()` on LLM output chunks, it removed leading spaces that acted as sentence boundary signals. The TTS would then run sentences together with no pause, producing unnatural speech.

The fix: `_normalize_for_tts()` and `_strip_think_tags()` explicitly do NOT call `.strip()`. Leading and trailing whitespace from LLM tokens is preserved through the entire pipeline.

## Sarvam AI in Production

Sarvam AI provides both our STT (saaras:v3) and TTS (bulbul:v3) models, purpose-built for Indian languages. Some production notes:

**Monkey-patching the LiveKit plugin.** The Sarvam STT WebSocket connection dies after roughly 90 seconds because the LiveKit plugin's `_run()` method breaks on normal stream completion instead of reconnecting. We monkey-patched `SpeechStream._run` to loop and reconnect until the session truly ends:

```python
async def _patched_stt_run(self):
    """Keep reconnecting the STT WebSocket until the session ends."""
    while True:
        try:
            await self._run_connection()
            if self._input_ch.closed:
                break  # Session ended
            self._logger.info("STT stream ended, reconnecting...")
            if self._session.closed:
                self._session = aiohttp.ClientSession()
        except Exception:
            await _orig_stt_run(self)
            break
```

**TTS preprocessing.** Sarvam's `enable_preprocessing=True` flag handles Romanized Hindi pronunciation internally, so we do not need a custom pronunciation dictionary. The LLM outputs "achha" and bulbul:v3 pronounces it correctly. We use the "shubh" male voice at 8kHz for telephony and 16kHz for browser testing.

**Audio parameters.** Phone calls run at 8kHz (standard telephony). Browser sessions use 16kHz for better quality. The voice agent dynamically selects the sample rate based on whether a phone number is present in the call metadata.

## Testing: 11 Shopkeeper Scenarios and 188 Unit Tests

Testing a voice agent that speaks Hindi and negotiates prices is not straightforward. We built a three-layer testing strategy.

### Layer 1: Shopkeeper Scenario Simulation

We created 11 scripted shopkeeper scenarios derived from real call transcripts. Each scenario has a personality: cooperative shopkeepers who give prices directly, defensive ones who refuse to negotiate, evasive ones who go off-topic, shopkeepers who ask questions back, ones who put you on hold, and ones who interrupt frequently.

```python
"defensive_price_firm": {
    "description": "Won't negotiate, defensive about online prices",
    "shopkeeper_turns": [
        "Boliye, kya chahiye?",
        "Paintaalees hazaar ka hai. Best price hai yeh.",
        "Online se mat compare karo bhai. Online mein installation
         nahi milta. Humse sab milega.",
        "Nahi, kam nahi hoga. Price fix hai.",
        "Installation humare yahan se do hazaar mein hota hai.",
        "Warranty ek saal ki milegi.",
    ],
    "expected_topics": {"price", "installation", "warranty"},
    "expect_end_call_eligible": True,
},
```

The test framework feeds shopkeeper lines one at a time into the actual LLM, building a real multi-turn conversation, and validates the agent's response after each turn.

### Layer 2: ConstraintChecker (8 Rules)

Every agent response is checked against 8 behavioral constraints:

1. **No Devanagari** -- Hindi script characters crash the TTS
2. **Single question** -- no stacking 3 questions in one breath
3. **Response length** -- under 300 characters (keep it brief)
4. **No action markers** -- no `*pauses*` or `(laughs)` text
5. **No newlines** -- TTS reads everything as one utterance
6. **No English translations** -- no `(Yes, I'm listening)` parentheticals
7. **No end_call text** -- use the tool, do not type `[end_call]`
8. **No invented details** -- do not fabricate specific brands or addresses

### Layer 3: ConversationScorer (Weighted Scoring)

Full conversations are scored on five dimensions with specific weights:

| Dimension | Weight | What It Measures |
|-----------|--------|------------------|
| Constraints | 40% | Average ConstraintChecker score across all turns |
| Topic coverage | 25% | How many of price/warranty/installation/delivery/exchange were discussed |
| Price echo | 15% | Did the agent repeat the shopkeeper's exact price number back |
| Brevity | 10% | Average response length (under 100 chars = perfect) |
| No repetition | 10% | Adjacent responses are not copies of each other |

The price echo scorer supports both digit forms ("38000") and Hindi word forms ("adtees hazaar") through a reverse mapping table. This catches the case where the shopkeeper says a price and the agent acknowledges a different number.

The full test suite has 188 unit tests covering normalization, sanitization, transcript parsing, store ranking, prompt building, and constraint checking, plus 26 live API tests that hit the actual Sarvam and Anthropic endpoints.

## Results: A Sample Call

Here is a condensed transcript from a real call to a local AC dealer in Bangalore:

```
Agent:  "Hello, yeh Pai Electronics hai? 1.5 ton split AC ke
         baare mein poochna tha."
Shop:   "Haan ji, Samsung hai. Boliye."
Agent:  "Bhaisaab, dedh ton ka paanch star inverter split AC
         ka best price kya doge?"
Shop:   "Adtees hazaar ka hai."
Agent:  "Achha, untaalees hazaar. Installation free hai kya?"
Shop:   "Installation free hai, hum apne aadmi bhejte hain."
Agent:  "Theek hai. Warranty kitni milegi?"
Shop:   "Ek saal company ki, aur compressor pe paanch saal."
Agent:  "Achha ek saal. Main 2-3 shops se rate le raha hoon.
         Thoda kam ho sakta hai?"
Shop:   "Nahi bhai, best price hai yeh."
Agent:  "Theek hai ji. Delivery kitne din mein hogi?"
Shop:   "Do-teen din mein laga denge. Stock mein hai."
Agent:  "Theek hai ji, bahut badiya. Dhanyavaad, namaste."
         [end_call tool invoked]
```

Quality analysis for this call: overall score 0.91, all 8 constraints passed, topics covered: price, installation, warranty, delivery. Agent correctly echoed the price, kept responses under 100 characters on average, and wrapped up in 6 turns.

On our 11-scenario test suite, the agent consistently scores above 0.85 overall, with constraint compliance above 0.95. The main failure mode is occasional response length violations when the agent tries to negotiate and explain simultaneously.

## What Is Next

We are working on three areas for the next phase:

**Negotiation intelligence.** The research phase already extracts dealer margins, seasonal pricing, and online reference prices. Phase 2 will use this intelligence more aggressively during calls -- dynamically adjusting negotiation pressure based on how the shopkeeper's quoted price compares to the researched market range.

**Voice A/B testing.** Sarvam's bulbul:v3 has 39 available speakers. We want to test whether different voices (male vs female, formal vs casual) affect the prices shopkeepers quote. The hypothesis: voice characteristics influence perceived social status, which affects the starting price.

**Product-specific conversation flows.** Right now the agent uses a generic conversation structure regardless of product type. An AC purchase involves tonnage confirmation and copper piping costs. A washing machine involves load capacity and drum type. A laptop involves use case and RAM requirements. Phase 2 will have product-specific conversation trees that go deeper on the questions that matter for each category.

---

*CallKaro is live at [callkaro.dewanggogte.com](https://callkaro.dewanggogte.com). The stack is LiveKit for WebRTC, Sarvam AI for Hindi STT/TTS, Claude Haiku 4.5 for the LLM, and a plain Python HTTP server holding it all together. No frameworks were harmed in the making of this project.*
