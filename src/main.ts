// Imports

// International

import './international/commands'
import { internationalManager } from './international/international'
import './international/config'
import './international/tickConfig'
import './international/creepOrganizer'
import './international/constructionSiteManager'
import './international/mapVisualsManager'
import './international/endTickManager'

// Room

import { roomsManager } from 'room/rooms'
import './room/roomAdditions'

import './room/resourceAdditions'
import './room/roomObjectFunctions'
import './room/roomObjectAdditions'
import './room/structureAdditions'

// Creep

import './room/creeps/creepAdditions'

// Other

import { memHack } from 'other/memHack'
import { customLog } from 'international/utils'
import { customColors, TrafficPriorities } from 'international/constants'
import { CommuneManager } from 'room/commune/commune'
import { configManager } from './international/config'
import { Quad } from 'room/creeps/roleManagers/antifa/quad'
import { Duo } from 'room/creeps/roleManagers/antifa/duo'
import { migrationManager } from 'international/migration'
import { respawnManager } from './international/respawn'
import { tickConfig } from './international/tickConfig'
import { allyManager } from 'international/simpleAllies'
import ExecutePandaMasterCode from './other/PandaMaster/Execute'
import { creepOrganizer } from './international/creepOrganizer'
import { powerCreepOrganizer } from 'international/powerCreepOrganizer'
import { ErrorMapper } from 'other/ErrorMapper'
import { globalStatsUpdater } from 'international/statsManager'
import { playerManager } from 'international/players'
import { profiler } from 'other/screeps-profiler'
import { SpawningStructuresManager } from 'room/commune/spawning/spawningStructures'
import { SpawnRequestsManager } from 'room/commune/spawning/spawnRequests'

export const loop = ErrorMapper.wrapLoop((): void => {
    profiler.wrap((): void => {
        if (Game.cpu.bucket < Math.max(Game.cpu.limit, 100)) {
            customLog('Skipping tick due to low bucket, bucket remaining', Game.cpu.bucket, {
                textColor: customColors.white,
                bgColor: customColors.red,
            })
            console.log(global.logs)
            return
        }

        memHack.run()

        internationalManager.update()

        // If CPU logging is enabled, get the CPU used at the start

        if (Memory.CPULogging === true) var managerCPUStart = Game.cpu.getUsed()

        // Run prototypes

        migrationManager.run()
        respawnManager.run()
        configManager.run()
        tickConfig.run()
        playerManager.run()
        creepOrganizer.run()
        powerCreepOrganizer.run()
        internationalManager.constructionSiteManager()
        internationalManager.orderManager()

        // Handle ally requests

        allyManager.tickConfig()
        allyManager.getAllyRequests()

        if (Memory.CPULogging === true) {
            const cpuUsed = Game.cpu.getUsed() - managerCPUStart
            customLog('International Manager', cpuUsed.toFixed(2), {
                textColor: customColors.white,
                bgColor: customColors.lightBlue,
            })
            const statName: InternationalStatNames = 'imcu'
            globalStatsUpdater('', statName, cpuUsed, true)
        }

        roomsManager()

        internationalManager.mapVisualsManager()

        internationalManager.advancedGeneratePixel()
        internationalManager.advancedSellPixels()

        internationalManager.endTickManager()
        if (Memory.me === 'PandaMaster') ExecutePandaMasterCode()
    })
})

// Profiler decs

profiler.registerClass(CommuneManager, 'CommuneManager')
profiler.registerClass(SpawningStructuresManager, 'SpawningStructuresManager')
profiler.registerClass(SpawnRequestsManager, 'SpawnRequestsManager')
profiler.registerFN(loop, 'loop')
