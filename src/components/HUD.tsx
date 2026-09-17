import React from 'react';
import { PlayerData, QuestData, LocationId } from '../types';
import { Shield, Zap, Sparkles, Coins, Trees, Eye, Home, CheckCircle2, Circle, Gem, Hammer, Award, BookOpen } from 'lucide-react';

interface TargetInfo {
  id?: string;
  name?: string;
  nameEn?: string;
  pos?: any;
  position?: any;
  icon?: string;
  color?: string;
  hint?: string;
  hintEn?: string;
  distance?: number;
}

interface HUDProps {
  playerData: PlayerData;
  questData: QuestData;
  currentLocation: LocationId;
  interactionText: string | null;
  heldObjectName: string | null;
  feedbackMessage: { text: string; type: 'success' | 'error' | 'info' } | null;
  onTogglePointerLock?: () => void;
  isPointerLocked?: boolean;
  onExitToMenu?: () => void;
  onOpenStory?: () => void;
  targetInfo?: TargetInfo | null;
}

export const HUD: React.FC<HUDProps> = ({
  playerData,
  questData,
  currentLocation,
  interactionText,
  heldObjectName,
  feedbackMessage,
  onTogglePointerLock,
  isPointerLocked,
  onExitToMenu,
  onOpenStory,
  targetInfo,
}) => {
  const [showWorldMap, setShowWorldMap] = React.useState(false);
  const [selectedMapZone, setSelectedMapZone] = React.useState<string | null>(null);
  const locationTitles: Record<LocationId, { title: string; subtitle: string }> = {
    GRAND_GATE: {
      title: 'GRAND GATE',
      subtitle: 'The Entrance to the Lost Realm',
    },
    HIDDEN_FOREST: {
      title: 'HIDDEN FOREST',
      subtitle: 'Enchanted Woodlands & Ancient Shrine',
    },
    RAINBOW_BRIDGE: {
      title: 'RAINBOW BRIDGE',
      subtitle: 'Prismatic Chasm & Optical Mechanism',
    },
    CASTLE_PLACE: {
      title: 'CASTLE PLACE',
      subtitle: 'Forgotten Citadel & Ancient Dragon Mural',
    },
    MYSTERY_ISLAND: {
      title: 'MYSTERY ISLAND',
      subtitle: 'Tropical Ruins & Environmental Symbols',
    },
    FAIRY_GARDEN: {
      title: 'FAIRY GARDEN',
      subtitle: 'Celestial Springs & Sacred Guardian Blossom',
    },
    DRAGON_VALLEY: {
      title: 'DRAGON VALLEY',
      subtitle: 'Sanctuary Peak & Dragon Purification',
    },
  };

  const loc = locationTitles[currentLocation] ?? {
    title: currentLocation ? (currentLocation as string).replace(/_/g, ' ') : 'LOST REALM',
    subtitle: 'The Lost Realm Adventure',
  };
  const xpPercent = Math.min(100, (playerData.xp / (playerData.level * 100)) * 100);

  return (
    <div className="pointer-events-none absolute inset-0 select-none overflow-hidden font-sans">
      {/* Top Left: Player Status Card */}
      <div className="pointer-events-auto absolute top-4 left-4 flex flex-col gap-2 rounded-2xl border border-slate-700/60 bg-slate-950/85 p-3.5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 font-black text-white shadow-md">
              {playerData.name.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-black tracking-wide text-slate-100">{playerData.name}</div>
              <div className="text-[11px] font-bold text-cyan-400">
                Level {playerData.level} Explorer
              </div>
            </div>
          </div>
          {/* Inventory summary */}
          <div className="flex items-center gap-2.5 border-l border-slate-800 pl-3">
            <div className="flex items-center gap-1 text-xs font-bold text-amber-400" title="Coins">
              <Coins className="h-4 w-4" />
              <span>{playerData.coins}</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-400" title="Wood Resources">
              <Trees className="h-4 w-4" />
              <span>{playerData.wood}</span>
            </div>
            {playerData.rainbowShard ? (
              <div className="flex items-center gap-1 text-xs font-bold text-cyan-300" title="Rainbow Shard">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span className="hidden sm:inline">Rainbow Shard</span>
              </div>
            ) : null}
            {playerData.dragonCrest ? (
              <div className="flex items-center gap-1 text-xs font-bold text-amber-400" title="Dragon Crest">
                <Shield className="h-4 w-4 text-amber-400" />
                <span className="hidden sm:inline">Dragon Crest</span>
              </div>
            ) : null}
            {playerData.mysteryRelic ? (
              <div className="flex items-center gap-1 text-xs font-bold text-purple-400" title="Mystery Relic">
                <Gem className="h-4 w-4 text-purple-400" />
                <span className="hidden sm:inline">Mystery Relic</span>
              </div>
            ) : null}
            {playerData.guardianBlossom ? (
              <div className="flex items-center gap-1 text-xs font-bold text-rose-400" title="Guardian Blossom">
                <Award className="h-4 w-4 text-rose-400" />
                <span className="hidden sm:inline">Guardian Blossom</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Health Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-300">
            <span className="flex items-center gap-1 font-bold">
              <Shield className={`h-3 w-3 ${playerData.health <= 30 ? 'text-red-500 animate-pulse' : 'text-red-400'}`} /> HP
            </span>
            <span className="font-mono font-semibold">
              {Math.round(playerData.health)} / {playerData.maxHealth}
              {playerData.health <= 30 && <span className="ml-1.5 text-[10px] text-red-400 font-bold animate-pulse">LOW HP!</span>}
            </span>
          </div>
          <div className="h-2 w-60 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                playerData.health <= 30
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 animate-pulse'
                  : 'bg-gradient-to-r from-red-500 to-rose-400'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, (playerData.health / playerData.maxHealth) * 100))}%` }}
            />
          </div>
        </div>

        {/* Stamina Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-300">
            <span className="flex items-center gap-1 font-bold">
              <Zap className={`h-3 w-3 ${playerData.stamina <= 15 ? 'text-orange-400 animate-pulse' : 'text-amber-400'}`} /> Stamina
            </span>
            <span className="font-mono font-semibold">
              {Math.round(playerData.stamina)} / {playerData.maxStamina}
              {playerData.stamina <= 15 && <span className="ml-1.5 text-[10px] text-orange-400 font-bold">EXHAUSTED</span>}
            </span>
          </div>
          <div className="h-2 w-60 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-150 ${
                playerData.stamina <= 15
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-400'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, (playerData.stamina / playerData.maxStamina) * 100))}%` }}
            />
          </div>
        </div>

        {/* XP Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-300">
            <span className="flex items-center gap-1 font-bold">
              <Sparkles className="h-3 w-3 text-cyan-400" /> XP
            </span>
            <span className="font-mono font-semibold">{playerData.xp} XP</span>
          </div>
          <div className="h-1.5 w-60 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Top Center: Fairy Mimi's Magic Waypoint Guide Banner */}
      <div className="pointer-events-auto absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 max-w-xl text-center">
        {targetInfo ? (
          <div className="flex items-center gap-3 rounded-2xl border-2 border-emerald-500/60 bg-slate-950/90 px-4 py-2 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-md">
              <span className="text-xl animate-bounce">{targetInfo.icon || '🧚'}</span>
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wide text-emerald-300">
                  WAYPOINT:
                </span>
                <span className="text-xs font-black" style={{ color: targetInfo.color || '#38bdf8' }}>
                  {targetInfo.name || targetInfo.nameEn || 'Active Objective'}
                </span>
                {typeof targetInfo.distance === 'number' && (
                  <span className="rounded-full bg-slate-800 px-2 py-0.2 text-[10px] font-black text-amber-300">
                    {targetInfo.distance}m
                  </span>
                )}
              </div>
              {(targetInfo.hint || targetInfo.hintEn) && (
                <div className="text-[11px] font-bold text-slate-200 leading-snug">
                  {targetInfo.hint || targetInfo.hintEn}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-full border border-cyan-500/30 bg-slate-950/85 px-6 py-1.5 shadow-lg backdrop-blur-md">
            <div className="text-xs font-black tracking-widest text-cyan-400 uppercase">{loc?.title || 'LOST REALM'}</div>
            <div className="text-[11px] text-slate-400">{loc?.subtitle || 'Explore and restore harmony'}</div>
          </div>
        )}
      </div>

      {/* Top Right: Buttons (World Map, Story Book, Pointer Lock, Menu) */}
      <div className="pointer-events-auto absolute top-4 right-4 flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          {/* World Map Button */}
          <button
            onClick={() => {
              setShowWorldMap(!showWorldMap);
              setSelectedMapZone(currentLocation);
            }}
            className="flex items-center gap-2 rounded-xl border-2 border-amber-500/80 bg-gradient-to-r from-amber-950 to-orange-950 px-3.5 py-1.5 text-xs font-black text-amber-200 shadow-xl hover:scale-105 hover:border-amber-400 transition-all cursor-pointer"
            title="Toggle World Map"
          >
            <Eye className="h-4 w-4 text-amber-400" />
            <span>🗺️ World Map</span>
          </button>

          {/* Story Book Button */}
          {currentLocation === 'HIDDEN_FOREST' && onOpenStory && (
            <button
              onClick={onOpenStory}
              className="flex items-center gap-2 rounded-xl border-2 border-emerald-500/80 bg-gradient-to-r from-emerald-950 to-teal-950 px-3.5 py-1.5 text-xs font-black text-emerald-200 shadow-xl hover:scale-105 hover:border-emerald-400 transition-all cursor-pointer animate-pulse"
              title="Open Story Book [H]"
            >
              <BookOpen className="h-4 w-4 text-emerald-400" />
              <span>🧚 Story [H]</span>
            </button>
          )}

          {onTogglePointerLock && (
            <button
              onClick={onTogglePointerLock}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-[11px] font-bold text-slate-200 shadow-md hover:bg-slate-800 transition-colors cursor-pointer"
              title="Toggle cursor pointer lock"
            >
              <Eye className="h-3.5 w-3.5 text-cyan-400" />
              <span>{isPointerLocked ? 'Pointer Locked (Esc)' : 'Lock Mouse Look'}</span>
            </button>
          )}

          {onExitToMenu && (
            <button
              onClick={onExitToMenu}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 text-[11px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Return to Realm Title Menu"
            >
              <Home className="h-3.5 w-3.5 text-amber-400" />
              <span>Menu</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Left: Controls Card (Child-Friendly & Simple) */}
      <div className="pointer-events-auto absolute bottom-4 left-4 rounded-2xl border border-slate-800/80 bg-slate-950/90 p-3.5 text-xs text-slate-200 shadow-2xl backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between border-b border-slate-800 pb-1 font-black tracking-wider text-cyan-400">
          <span>HOW TO PLAY</span>
          <span className="text-[10px] text-slate-400">🎮 Kids Ready</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono font-bold text-cyan-300">WASD</kbd>
            <span>🏃 Walk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono font-bold text-amber-300">Shift</kbd>
            <span>⚡ Sprint</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono font-bold text-cyan-300">Space</kbd>
            <span>🦘 Jump</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="rounded bg-cyan-500 px-1.5 py-0.5 font-mono font-black text-black">E</kbd>
            <span>✨ Action</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="rounded bg-emerald-700 px-1.5 py-0.5 font-mono font-bold text-white">H</kbd>
            <span>🧚 Story</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono font-bold text-cyan-300">R</kbd>
            <span>🔄 Rotate</span>
          </div>
        </div>
      </div>

      {/* Right: Quest Tracker Card (Dynamic Multi-Stage Adventure) */}
      <div className="pointer-events-auto absolute top-24 right-4 w-84 rounded-2xl border-2 border-amber-500/50 bg-slate-950/92 p-4 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-black tracking-widest text-amber-400 uppercase">
            <span>✨</span>
            <span>
              PHASE{' '}
              {questData.phase ??
                (currentLocation === 'RAINBOW_BRIDGE'
                  ? 2
                  : currentLocation === 'CASTLE_PLACE'
                  ? 3
                  : currentLocation === 'MYSTERY_ISLAND'
                  ? 4
                  : currentLocation === 'FAIRY_GARDEN' || currentLocation === 'DRAGON_VALLEY'
                  ? 5
                  : 1)}{' '}
              / 5
            </span>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-cyan-300 border border-slate-700 uppercase tracking-wider">
            {currentLocation.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="mt-2 text-sm font-black text-slate-100">
          {questData.currentQuest}
        </div>
        <div className="mt-1 text-xs text-slate-300 leading-relaxed font-medium">
          <span className="text-amber-400/90 font-bold uppercase tracking-wider text-[10px] block mb-0.5">
            CURRENT OBJECTIVE:
          </span>
          "{questData.objective}"
        </div>

        {/* Dynamic Stage Checklist / Sub-objectives */}
        {questData.stage && (
          <div className="mt-3 rounded-xl border border-slate-800/80 bg-slate-900/70 p-2.5 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[10px] font-black tracking-wider text-emerald-400 uppercase">
              <span>STAGE CHECKLIST</span>
              <span className="text-slate-400 font-mono">
                {currentLocation.replace(/_/g, ' ')}
              </span>
            </div>

            {/* PHASE 2: RAINBOW BRIDGE */}
            {currentLocation === 'RAINBOW_BRIDGE' && (
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-200">
                  <span>1. West Hydraulic Lever:</span>
                  <span className="font-black text-cyan-400">Engage [E]</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span>2. East Optical Lever:</span>
                  <span className="font-black text-amber-400">Engage [E]</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span>3. Central Resonator:</span>
                  <span className="font-black text-purple-400">Engage [E]</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span>4. Optical Prism:</span>
                  <span className="font-black text-emerald-400">Carry to Pedestal</span>
                </div>
                <div className="text-[10px] font-bold text-cyan-300 pt-0.5">
                  Cross the restored rainbow bridge and claim the Rainbow Shard!
                </div>
              </div>
            )}

            {/* PHASE 3: CASTLE PLACE */}
            {currentLocation === 'CASTLE_PLACE' && (
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-200">
                  <span>1. Golden Gear & Winch:</span>
                  <span className="font-black text-amber-400">Armory Anvil [E]</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span>2. Springboard & Banners:</span>
                  <span className="font-black text-cyan-400">Courtyard Fun [E]</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span>3. Knight Statues & Bells:</span>
                  <span className="font-black text-emerald-400">Equip Shield / Chime</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span>4. Dragon Mural Sanctum:</span>
                  <span className="font-black text-purple-400">Unveil Truth [E]</span>
                </div>
                <div className="text-[10px] font-bold text-amber-300 pt-0.5">
                  Raise the portcullis, open treasure chests, and discover the mural!
                </div>
              </div>
            )}

            {/* PHASE 4: MYSTERY ISLAND */}
            {(currentLocation === 'MYSTERY_ISLAND' || (currentLocation as string) === 'MYSTERY_CAVE') && (
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-200">
                  <span>1. Three Sun Emblems:</span>
                  <span className="font-black text-amber-300">Collect Emblems along Trails (Follow Beacons)</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span>2. Sun Altar:</span>
                  <span className="font-black text-cyan-300">Activate Altar & Unlock Sun Temple [E]</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span>3. Dragon Mural:</span>
                  <span className="font-black text-emerald-300">Examine Dragon Mural Inside Temple [E]</span>
                </div>
                <div className="text-[10px] font-bold text-amber-300 pt-0.5">
                  Follow the high glowing light beacons across the tropical island paths!
                </div>
              </div>
            )}

            {/* PHASE 5: FAIRY GARDEN */}
            {currentLocation === 'FAIRY_GARDEN' && (
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-200">
                  <span>1. Fairy Fountain:</span>
                  <span className="font-black text-cyan-300">Restore Celestial Water</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span>2. Fairy Seeds:</span>
                  <span className="font-black text-yellow-300">Gather 3 Seeds & Plant</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span>3. Grand Healing Tree:</span>
                  <span className="font-black text-rose-300">Claim Guardian Blossom</span>
                </div>
              </div>
            )}

            {/* PHASE 5: DRAGON VALLEY */}
            {currentLocation === 'DRAGON_VALLEY' && (
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-200">
                  <span>1. Three Pillars:</span>
                  <span className="font-black text-cyan-400">Activate Fire, Ice & Nature Pillars</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span>2. Dragon Altar:</span>
                  <span className="font-black text-rose-400">Place Guardian Blossom [E]</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span>3. Corrupted Dragon:</span>
                  <span className="font-black text-amber-400">Remove Corruption Crystal & Purify! [E]</span>
                </div>
                <div className="text-[10px] font-bold text-amber-300 pt-0.5">
                  Follow the high sky beams to empower the altar and save the dragon!
                </div>
              </div>
            )}

            {questData.stage === 'CRYSTALS' && (
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-200">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Gem className="h-3.5 w-3.5 text-cyan-400" />
                    Azure Crystal (Ancient Ruins)
                  </span>
                  {questData.hasAzure ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Circle className="h-4 w-4 text-slate-500" />}
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Gem className="h-3.5 w-3.5 text-emerald-400" />
                    Emerald Crystal (Waterfall)
                  </span>
                  {questData.hasEmerald ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Circle className="h-4 w-4 text-slate-500" />}
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Gem className="h-3.5 w-3.5 text-purple-400" />
                    Moon Crystal (Overgrown Altar)
                  </span>
                  {questData.hasMoon ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Circle className="h-4 w-4 text-slate-500" />}
                </div>
                <div className="mt-1 text-[10px] font-bold text-amber-300">
                  Follow the sky light beams into the jungle!
                </div>
              </div>
            )}

            {questData.stage === 'WATER_FLOW' && (
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-200">
                  <span>Channel Stones Placed:</span>
                  <span className="font-black text-cyan-300">{questData.waterStonesPlaced ?? 0} / 2</span>
                </div>
                <div className="text-[10px] font-bold text-cyan-300">
                  Pick up fallen stone with [E], carry to glowing canal and press [E]!
                </div>
              </div>
            )}

            {questData.stage === 'GATHER_MATERIALS' && (
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-200">
                  <span>Hardwood Timber Logs:</span>
                  <span className="font-black text-amber-300">{questData.logsGathered ?? 0} / 3</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span>Sturdy Rope Bundles:</span>
                  <span className="font-black text-yellow-300">{questData.ropesGathered ?? 0} / 2</span>
                </div>
                <div className="text-[10px] font-bold text-amber-300">
                  Pick up all 3 glowing logs and 2 ropes with [E]!
                </div>
              </div>
            )}

            {questData.stage === 'BUILD_BRIDGE' && (
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-200">
                  <span>Timber Logs Placed:</span>
                  <span className="font-black text-cyan-300">{questData.bridgeLogsPlaced ?? 0} / 3</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span>Anchor Ropes Attached:</span>
                  <span className="font-black text-cyan-300">{questData.bridgeRopesAttached ?? 0} / 2</span>
                </div>
                <div className="text-[10px] font-bold text-emerald-300">
                  Walk to the glowing river crossing and press [E] to build!
                </div>
              </div>
            )}

            {questData.stage === 'SHRINE_CRYSTALS' && (
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-200">
                  <span>Crystals in Altar Pedestals:</span>
                  <span className="font-black text-purple-300">{questData.shrineCrystalsInserted ?? 0} / 3</span>
                </div>
                <div className="text-[10px] font-bold text-purple-300">
                  Cross the bridge and press [E] at each pedestal!
                </div>
              </div>
            )}

            {questData.stage === 'DRAGON_VALLEY' && (
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-200">
                  <span>Dragon Braziers Lit:</span>
                  <span className="font-black text-amber-400">{questData.dragonBraziersLit ?? 0} / 2</span>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span>Golden Dragon Totem:</span>
                  <span className={`font-black ${questData.dragonAwakened ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {questData.dragonAwakened ? 'Awakened ✓' : 'Awaiting Awakening'}
                  </span>
                </div>
                <div className="text-[10px] font-bold text-amber-300">
                  Ignite both braziers with [E], then touch Golden Dragon Totem!
                </div>
              </div>
            )}

            {questData.stage === 'COMPLETED' && (
              <div className="space-y-1 text-[11px] font-black text-emerald-400">
                <div>👑 All 5 Levels Conquered!</div>
                <div className="text-[10px] text-emerald-300 font-medium">The Realm is restored and the Golden Dragon reigns in peace!</div>
              </div>
            )}
          </div>
        )}

        {questData.questStatus !== 'COMPLETED' && (
          <div className="mt-2.5 flex items-center justify-between text-[11px] border-t border-slate-800/80 pt-2 text-slate-300">
            <span className="text-slate-400">Reward:</span>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-black">+{questData.reward.xp} XP</span>
              <span className="text-yellow-400 font-black">+{questData.reward.coins} Coins</span>
            </div>
          </div>
        )}
      </div>

      {/* Center Screen: Dynamic Interaction Prompt */}
      {interactionText && !heldObjectName && (
        <div className="absolute top-2/3 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce pointer-events-auto">
          <div className="flex items-center gap-2.5 rounded-2xl border-2 border-cyan-400/80 bg-slate-950/95 px-6 py-2.5 shadow-2xl backdrop-blur-md">
            <span className="rounded-lg bg-cyan-500 px-2.5 py-1 font-mono text-sm font-black text-black shadow">E</span>
            <span className="text-sm font-black tracking-wide text-cyan-100 uppercase">{interactionText}</span>
          </div>
        </div>
      )}

      {/* Holding Object Manipulation Overlay */}
      {heldObjectName && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 pointer-events-auto">
          <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-cyan-500/70 bg-slate-950/95 px-6 py-3 shadow-2xl backdrop-blur-md">
            <div className="text-xs font-black text-cyan-400 uppercase">
              HOLDING: <span className="text-white">{heldObjectName}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-200">
              <span className="flex items-center gap-1.5">
                <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-cyan-300 font-bold">WASD</kbd> 
                Move
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-cyan-300 font-bold">R</kbd> 
                Rotate
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded bg-cyan-500 px-1.5 py-0.5 font-mono text-black font-black">E / L-Click</kbd> 
                Place
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded bg-red-800 px-1.5 py-0.5 font-mono text-white font-bold">R-Click</kbd> 
                Drop
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Feedback Toast */}
      {feedbackMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 transition-all pointer-events-none">
          <div
            className={`rounded-full px-6 py-2 text-sm font-black shadow-2xl backdrop-blur-md border ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-950/95 text-emerald-200 border-emerald-400'
                : feedbackMessage.type === 'error'
                ? 'bg-rose-950/95 text-rose-200 border-rose-500'
                : 'bg-cyan-950/95 text-cyan-200 border-cyan-400'
            }`}
          >
            {feedbackMessage.text}
          </div>
        </div>
      )}

      {/* Low Health Screen Vignette Indicator */}
      {playerData.health <= 30 && (
        <div className="pointer-events-none absolute inset-0 z-10 border-4 border-red-600/30 shadow-[inset_0_0_100px_rgba(220,38,38,0.45)] animate-pulse" />
      )}

      {/* Full-Screen Interactive World Map Overlay */}
      {showWorldMap && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-xl animate-in fade-in zoom-in-95">
          <div className="relative flex h-[90vh] w-[95vw] max-w-6xl flex-col rounded-3xl border-2 border-amber-500/70 bg-slate-900/95 shadow-2xl overflow-hidden">
            
            {/* Map Modal Header */}
            <div className="flex items-center justify-between border-b border-amber-500/30 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 font-black text-black text-xl shadow-lg">
                  🗺️
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-wide text-amber-200">ADVENTURE QUEST WORLD MAP</h2>
                  <p className="text-xs font-semibold text-slate-400">Interactive Realm Map & Region Guide</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-cyan-300 border border-slate-700">
                  Current: <strong className="text-amber-300">{currentLocation.replace(/_/g, ' ')}</strong>
                </span>
                <button
                  onClick={() => setShowWorldMap(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-black text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  ✕ CLOSE [ESC]
                </button>
              </div>
            </div>

            {/* Map Content Body */}
            <div className="grid flex-1 grid-cols-1 gap-4 p-6 lg:grid-cols-3 overflow-y-auto">
              
              {/* Left 2 Columns: Visual Region Diagram Canvas */}
              <div className="lg:col-span-2 relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-inner min-h-[420px] bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]">
                
                <div className="text-xs font-black tracking-wider text-amber-400/80 uppercase">REALM LAYOUT & PATHWAYS</div>

                {/* Region Nodes Container */}
                <div className="my-auto grid grid-cols-2 sm:grid-cols-3 gap-4">
                  
                  {/* Node 1: Grand Gate */}
                  <div
                    onClick={() => setSelectedMapZone('GRAND_GATE')}
                    className={`cursor-pointer rounded-2xl border-2 p-4 transition-all hover:scale-105 shadow-xl ${
                      selectedMapZone === 'GRAND_GATE'
                        ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-400/50'
                        : 'border-slate-700 bg-slate-900/80 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🏛️</span>
                      {currentLocation === 'GRAND_GATE' && (
                        <span className="animate-pulse rounded-full bg-cyan-500 px-2 py-0.5 text-[10px] font-black text-black">YOU ARE HERE</span>
                      )}
                    </div>
                    <div className="mt-2 text-sm font-black text-slate-100">1. GRAND GATE</div>
                    <div className="text-[11px] font-bold text-slate-400">Guardian & Realm Entrance</div>
                  </div>

                  {/* Node 2: Hidden Forest */}
                  <div
                    onClick={() => setSelectedMapZone('HIDDEN_FOREST')}
                    className={`cursor-pointer rounded-2xl border-2 p-4 transition-all hover:scale-105 shadow-xl ${
                      selectedMapZone === 'HIDDEN_FOREST'
                        ? 'border-emerald-400 bg-emerald-950/60 ring-2 ring-emerald-400/50'
                        : 'border-slate-700 bg-slate-900/80 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🌲</span>
                      {currentLocation === 'HIDDEN_FOREST' && (
                        <span className="animate-pulse rounded-full bg-cyan-500 px-2 py-0.5 text-[10px] font-black text-black">YOU ARE HERE</span>
                      )}
                    </div>
                    <div className="mt-2 text-sm font-black text-emerald-300">2. HIDDEN FOREST</div>
                    <div className="text-[11px] font-bold text-slate-400">Ravine Bridge & Crystal Shrine</div>
                  </div>

                  {/* Node 3: Castle Place */}
                  <div
                    onClick={() => setSelectedMapZone('CASTLE_PLACE')}
                    className={`cursor-pointer rounded-2xl border-2 p-4 transition-all hover:scale-105 shadow-xl ${
                      selectedMapZone === 'CASTLE_PLACE'
                        ? 'border-blue-400 bg-blue-950/60 ring-2 ring-blue-400/50'
                        : 'border-slate-700 bg-slate-900/80 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🏰</span>
                      {currentLocation === 'CASTLE_PLACE' && (
                        <span className="animate-pulse rounded-full bg-cyan-500 px-2 py-0.5 text-[10px] font-black text-black">YOU ARE HERE</span>
                      )}
                    </div>
                    <div className="mt-2 text-sm font-black text-blue-300">3. CASTLE PLACE</div>
                    <div className="text-[11px] font-bold text-slate-400">Anvil Forge & Gate Winch</div>
                  </div>

                  {/* Node 4: Mystery Island */}
                  <div
                    onClick={() => setSelectedMapZone('MYSTERY_ISLAND')}
                    className={`cursor-pointer rounded-2xl border-2 p-4 transition-all hover:scale-105 shadow-xl ${
                      selectedMapZone === 'MYSTERY_ISLAND'
                        ? 'border-cyan-400 bg-cyan-950/60 ring-2 ring-cyan-400/50'
                        : 'border-slate-700 bg-slate-900/80 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🏝️</span>
                      {currentLocation === 'MYSTERY_ISLAND' && (
                        <span className="animate-pulse rounded-full bg-cyan-500 px-2 py-0.5 text-[10px] font-black text-black">YOU ARE HERE</span>
                      )}
                    </div>
                    <div className="mt-2 text-sm font-black text-cyan-300">4. MYSTERY ISLAND</div>
                    <div className="text-[11px] font-bold text-slate-400">Sun Emblems & Sun Temple</div>
                  </div>

                  {/* Node 5: Fairy Garden */}
                  <div
                    onClick={() => setSelectedMapZone('FAIRY_GARDEN')}
                    className={`cursor-pointer rounded-2xl border-2 p-4 transition-all hover:scale-105 shadow-xl ${
                      selectedMapZone === 'FAIRY_GARDEN'
                        ? 'border-rose-400 bg-rose-950/60 ring-2 ring-rose-400/50'
                        : 'border-slate-700 bg-slate-900/80 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🌸</span>
                      {currentLocation === 'FAIRY_GARDEN' && (
                        <span className="animate-pulse rounded-full bg-cyan-500 px-2 py-0.5 text-[10px] font-black text-black">YOU ARE HERE</span>
                      )}
                    </div>
                    <div className="mt-2 text-sm font-black text-rose-300">5. FAIRY GARDEN</div>
                    <div className="text-[11px] font-bold text-slate-400">Celestial Spring & Healing Tree</div>
                  </div>

                  {/* Node 6: Dragon Valley */}
                  <div
                    onClick={() => setSelectedMapZone('DRAGON_VALLEY')}
                    className={`cursor-pointer rounded-2xl border-2 p-4 transition-all hover:scale-105 shadow-xl ${
                      selectedMapZone === 'DRAGON_VALLEY'
                        ? 'border-purple-400 bg-purple-950/60 ring-2 ring-purple-400/50'
                        : 'border-slate-700 bg-slate-900/80 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🐉</span>
                      {currentLocation === 'DRAGON_VALLEY' && (
                        <span className="animate-pulse rounded-full bg-cyan-500 px-2 py-0.5 text-[10px] font-black text-black">YOU ARE HERE</span>
                      )}
                    </div>
                    <div className="mt-2 text-sm font-black text-purple-300">6. DRAGON VALLEY</div>
                    <div className="text-[11px] font-bold text-slate-400">Pillars & Golden Celestial Dragon</div>
                  </div>

                </div>

                {/* Compass & Key Legend Footer */}
                <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1 text-amber-300">
                    <span className="h-2 w-2 rounded-full bg-amber-400"></span> Main Progression Path
                  </span>
                  <span>Click any region above for zone details & guide</span>
                </div>

              </div>

              {/* Right Column: Selected Region Details Card */}
              <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl justify-between">
                <div>
                  <div className="text-xs font-black tracking-wider text-amber-400 uppercase">REGION DETAILS</div>
                  
                  {selectedMapZone === 'GRAND_GATE' && (
                    <div className="mt-4 space-y-3">
                      <h3 className="text-base font-black text-amber-200">1. Grand Gate Entrance</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        The ancient threshold to the realm. Speak with the hooded Guardian NPC to accept your quest and begin your journey through the realm.
                      </p>
                      <div className="rounded-xl bg-slate-950 p-3 text-xs font-bold text-cyan-300 border border-slate-800">
                        📍 Key Landmarks: Fortress Archway, Guardian Pillar, Main Highway.
                      </div>
                    </div>
                  )}

                  {selectedMapZone === 'HIDDEN_FOREST' && (
                    <div className="mt-4 space-y-3">
                      <h3 className="text-base font-black text-emerald-300">2. Hidden Forest</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Dense enchanted woodlands. Pick up logs to bridge the ravine chasm, restore water channel blocks, and insert glowing crystals into the Ancient Shrine.
                      </p>
                      <div className="rounded-xl bg-slate-950 p-3 text-xs font-bold text-emerald-300 border border-slate-800">
                        📍 Key Landmarks: Ravine Bridge, Water Channel, Ancient Crystal Shrine.
                      </div>
                    </div>
                  )}

                  {selectedMapZone === 'CASTLE_PLACE' && (
                    <div className="mt-4 space-y-3">
                      <h3 className="text-base font-black text-blue-300">3. Castle Place & Citadel</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Forge the Golden Stone Gear at the Anvil and slot it into the Castle Winch mechanism to raise the portcullis gate.
                      </p>
                      <div className="rounded-xl bg-slate-950 p-3 text-xs font-bold text-blue-300 border border-slate-800">
                        📍 Key Landmarks: Anvil Forge, Castle Courtyard, Portcullis Gate Winch.
                      </div>
                    </div>
                  )}

                  {selectedMapZone === 'MYSTERY_ISLAND' && (
                    <div className="mt-4 space-y-3">
                      <h3 className="text-base font-black text-cyan-300">4. Mystery Island</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Tropical island with cobblestone trails. Gather the 3 Sun Emblems, activate the Sun Temple Altar, and open the marble doors to examine the Dragon Mural.
                      </p>
                      <div className="rounded-xl bg-slate-950 p-3 text-xs font-bold text-cyan-300 border border-slate-800">
                        📍 Key Landmarks: Waterfall, Ancient Oak, Lighthouse, Sun Temple Altar.
                      </div>
                    </div>
                  )}

                  {selectedMapZone === 'FAIRY_GARDEN' && (
                    <div className="mt-4 space-y-3">
                      <h3 className="text-base font-black text-rose-300">5. Fairy Garden</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Restore the Celestial Fountain with pure water, plant 3 Fairy Seeds in the garden bed, and claim the Guardian Blossom from the Grand Healing Tree.
                      </p>
                      <div className="rounded-xl bg-slate-950 p-3 text-xs font-bold text-rose-300 border border-slate-800">
                        📍 Key Landmarks: Celestial Fountain, Planting Bed, Grand Healing Tree.
                      </div>
                    </div>
                  )}

                  {selectedMapZone === 'DRAGON_VALLEY' && (
                    <div className="mt-4 space-y-3">
                      <h3 className="text-base font-black text-purple-300">6. Dragon Valley Sanctuary</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Empower the Fire, Ice, and Nature Pillars with sky beams, place the Guardian Blossom at the altar, and remove the corruption stone to save the Golden Celestial Dragon!
                      </p>
                      <div className="rounded-xl bg-slate-950 p-3 text-xs font-bold text-purple-300 border border-slate-800">
                        📍 Key Landmarks: 3 Elemental Sky Beacons, Dragon Altar, Golden Celestial Dragon.
                      </div>
                    </div>
                  )}

                  {(!selectedMapZone || selectedMapZone === currentLocation) && (
                    <div className="mt-4 space-y-3">
                      <h3 className="text-base font-black text-amber-200">Active Location Overview</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Select any region on the map grid to inspect its objectives and landmarks.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 border-t border-slate-800 pt-4">
                  <button
                    onClick={() => setShowWorldMap(false)}
                    className="w-full rounded-xl bg-amber-500 py-3 text-xs font-black text-black shadow-lg hover:bg-amber-400 transition-colors cursor-pointer"
                  >
                    RETURN TO GAMEPLAY
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
};
