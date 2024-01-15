import { RoomMemoryKeys, Result, NukeRequestKeys, RoomLogisticsRequestTypes } from "international/constants"
import { roomObjectUtils } from "room/roomObjectUtils"

const nukerResources = [RESOURCE_ENERGY, RESOURCE_GHODIUM]

export class NukerProcs {
  run(room: Room) {
    const roomMemory = Memory.rooms[room.name]
    const requestName = roomMemory[RoomMemoryKeys.nukeRequest]
    if (!requestName) return

    const nuker = room.roomManager.nuker
    if (!nuker) {
        return
    }

    if (this.createRoomLogisticsRequests(room, nuker) === Result.action) return

    const request = Memory.nukeRequests[requestName]
    nuker.launchNuke(
        new RoomPosition(request[NukeRequestKeys.x], request[NukeRequestKeys.y], requestName),
    )
}

private createRoomLogisticsRequests(room: Room, nuker: StructureNuker) {
    let result = Result.noAction

    for (const resource of nukerResources) {
        if (roomObjectUtils.freeReserveStoreOf(nuker, resource) <= 0) continue

        room.createRoomLogisticsRequest({
            target: nuker,
            type: RoomLogisticsRequestTypes.transfer,
            priority: 100,
        })

        result = Result.action
    }

    return result
}
}

export const nukerProcs = new NukerProcs()