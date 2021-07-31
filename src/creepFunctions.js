let allyList = require("allyList")
let roomVariables = require("roomVariables")


Creep.prototype.isEdge = function() {

    if (creep.pos.x <= 0 || creep.pos.x >= 49 || creep.pos.y <= 0 || creep.pos.y >= 49) {

        return true
    }

    return false
}
Creep.prototype.findRemoteRoom = function() {

    if (!creep.memory.remoteRoom) {

        for (let remoteRoom of Memory.rooms[creep.memory.roomFrom].remoteRooms) {

            if (remoteRoom.creepsOfRole[creep.memory.role] < remoteRoom.minCreeps[creep.memory.role]) {

                creep.memory.remoteRoom = remoteRoom
            }
        }
    }
}

Creep.prototype.barricadesFindAndRepair = function() {

    if (creep.memory.target) {

        let barricade = Game.getObjectById(creep.memory.target)

        if (barricade.hits < barricade.hitsMax && barricade.hits < (creep.memory.quota + creep.myParts("work") * 1000)) {

            creep.repairBarricades(barricade)
        } else {

            creep.memory.target = undefined
        }
    } else {

        var barricades = creep.room.find(FIND_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_RAMPART || s.structureType == STRUCTURE_WALL
        })

        for (let quota = creep.myParts("work") * 1000; quota < barricades[0].hitsMax; quota += creep.myParts("work") * 1000) {

            let barricade = creep.room.find(FIND_STRUCTURES, {
                filter: s => (s.structureType == STRUCTURE_RAMPART || s.structureType == STRUCTURE_WALL) && s.hits < quota
            })

            if (barricade.length > 0) {

                barricade = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: s => (s.structureType == STRUCTURE_RAMPART || s.structureType == STRUCTURE_WALL) && s.hits < quota
                })

                creep.repairBarricades(barricade)

                creep.memory.target = barricade.id
                creep.memory.quota = quota

                break
            } else {

                creep.say("No target")
            }
        }
    }
}

Creep.prototype.myParts = function(partType) {

    creep = this

    let partsAmount = 0

    for (let part of creep.body) {

        if (part.type == partType) {

            partsAmount++
        }
    }
    return partsAmount
}
Creep.prototype.findEnergyHarvested = function(source) {

    creep = this

    let energyHarvested = source.energy - source.energy + creep.myParts("work")

    creep.say("⛏️ " + energyHarvested)
    Memory.data.energyHarvested += energyHarvested
}
Creep.prototype.findMineralsHarvested = function(mineral) {

    creep = this

    let mineralsHarvested = mineral.mineralAmount - mineral.mineralAmount + creep.myParts("work")

    creep.say("⛏️ " + mineralsHarvested)
    Memory.data.mineralsHarvested += mineralsHarvested
}
Creep.prototype.isFull = function() {

    creep = this

    if (creep.store.getUsedCapacity() == 0) {

        creep.memory.isFull = false

    } else if (creep.store.getUsedCapacity() == creep.store.getCapacity()) {

        creep.memory.isFull = true

    }
}
Creep.prototype.hasResource = function() {

    creep = this

    if (creep.store.getUsedCapacity() === 0) {

        creep.memory.isFull = false

    } else {

        creep.memory.isFull = true

    }
}
Creep.prototype.pickupDroppedEnergy = function(target) {

    if (!target) return

    if (creep.pos.getRangeTo(target) <= 1) {

        creep.pickup(target, RESOURCE_ENERGY)
        return 0

    } else {

        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 1 }
        })

        creep.intraRoomPathing(creep.pos, goal)
    }
}
Creep.prototype.advancedWithdraw = function(target, resource, amount) {

    if (!target) return

    if (!resource) {

        resource = RESOURCE_ENERGY
    }
    if (!amount || amount > creep.store.getFreeCapacity()) {

        amount = creep.store.getFreeCapacity()
    }

    if (creep.pos.isNearTo(target)) {

        creep.withdraw(target, resource, [amount])
        return 0

    } else {

        let origin = creep.pos

        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 1 }
        })

        creep.intraRoomPathing(origin, goal)
    }
}
Creep.prototype.advancedTransfer = function(target, resource) {

    if (!target) return

    if (!resource) {

        resource = RESOURCE_ENERGY
    }

    if (creep.pos.isNearTo(target)) {

        creep.transfer(target, resource)
        return 0

    } else {

        let origin = creep.pos

        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 1 }
        })

        creep.intraRoomPathing(origin, goal)
    }
}
Creep.prototype.repairBarricades = function(target) {

    if (!target) return

    creep = this

    creep.room.visual.text("🧱", target.pos.x, target.pos.y + 0.25, { align: 'center' })

    if (creep.pos.getRangeTo(target) > 3) {

        let origin = creep.pos

        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 3 }
        })

        creep.intraRoomPathing(origin, goal)

    } else if (creep.repair(target) == 0) {

        creep.say("🧱 " + creep.myParts("work"))

        Memory.data.energySpentOnBarricades += creep.myParts("work")
    }
}
Creep.prototype.repairStructure = function(target) {

    if (!target) return

    creep = this

    creep.room.visual.text("🔧", target.pos.x, target.pos.y + 0.25, { align: 'center' })

    if (creep.pos.getRangeTo(target) > 3) {

        let origin = creep.pos

        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 3 }
        })

        creep.intraRoomPathing(origin, goal)

    } else if (creep.repair(target) == 0) {

        creep.say("🔧 " + creep.myParts("work"))

        Memory.data.energySpentOnRepairs += creep.myParts("work")
    }
}
Creep.prototype.constructionBuild = function(target) {

    if (!target) return

    creep = this

    creep.room.visual.text("🚧", target.pos.x, target.pos.y + 0.25, { align: 'center' })

    if (creep.pos.getRangeTo(target) > 3) {

        let origin = creep.pos

        let goal = _.map([target], function(target) {
            return { pos: target.pos, range: 3 }
        })

        creep.intraRoomPathing(origin, goal)

    } else if (creep.build(target) == 0) {

        creep.say("🚧 " + creep.myParts("work"))

        Memory.data.energySpentOnConstruction += creep.myParts("work")
    }
}
Creep.prototype.controllerUpgrade = function(controller) {

    if (creep.pos.getRangeTo(controller) > 3) {

        let goal = _.map([controller], function(target) {
            return { pos: target.pos, range: 1 }
        })

        creep.intraRoomPathing(creep.pos, goal)

    } else if (creep.upgradeController(controller) == 0) {

        creep.say("🔋 " + creep.myParts("work"))
        Memory.data.controlPoints += creep.myParts("work")
    }
}
Creep.prototype.searchSourceContainers = function() {

    creep = this

    let sourceContainer1 = Game.getObjectById(creep.room.memory.sourceContainer1)
    let sourceContainer2 = Game.getObjectById(creep.room.memory.sourceContainer2)

    let containerTarget = [sourceContainer1, sourceContainer2]

    for (var i = 0; i < containerTarget.length; i++) {

        let container = containerTarget[i]
        if (container != null) {
            if (container.store[RESOURCE_ENERGY] >= creep.store.getCapacity()) {

                creep.container = container
                break
            }
        } else {

            i = 0

            break
        }
    }
}
Creep.prototype.avoidHostiles = function() {

    let creep = this

    let hostiles = creep.room.find(FIND_HOSTILE_CREEPS, {
        filter: (c) => {
            return (allyList.indexOf(c.owner.username.toLowerCase()) === -1 && (c.getActiveBodyparts(ATTACK) > 0 || c.getActiveBodyparts(RANGED_ATTACK) > 0))
        }
    })

    if (hostiles.length > 0) {
        for (let hostile of hostiles) {

            if (creep.pos.getRangeTo(hostile) <= 6) {

                creep.say("H! RUN RUN")

                let goal = _.map([hostile], function(target) {
                    return { pos: target.pos, range: 7 }
                })

                creep.creepFlee(creep.pos, goal)
                break
            }
        }
    }
}
Creep.prototype.findDamagePossible = function(creep, healers, towers) {

    let distance = creep.pos.getRangeTo(creep.pos.findClosestByRange(towers))

    let towerDamage = (C.TOWER_FALLOFF * (distance - C.TOWER_OPTIMAL_RANGE) / (C.TOWER_FALLOFF_RANGE - C.TOWER_OPTIMAL_RANGE)) * towers.length

    let healAmount = 0

    if (creep) {

        for (let part of creep.body) {

            if (part.type == TOUGH && part.boost) {

                towerDamage = towerDamage * 0.3
                break
            }
        }
    }

    if (healers.length > 0) {

        for (let healer of healers) {

            for (let part in healer.body) {

                if (part.type == HEAL) {

                    if (part.boost == RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE) {

                        healAmount += 36

                    } else if (part.boost == RESOURCE_LEMERGIUM_ALKALIDE) {

                        healAmount += 24

                    } else if (part.boost == RESOURCE_LEMERGIUM_OXIDE) {

                        healAmount += 12
                    }

                    healAmount += 12
                }
            }
        }
    }

    let damagePossible = towerDamage - healAmount

    return damagePossible
}
Creep.prototype.findClosestDistancePossible = function(creep, healers, closestTower, towerCount) {

    let distance = creep.pos.getRangeTo(creep.pos.findClosestByRange(towers))

    let towerDamage = (C.TOWER_FALLOFF * (distance - C.TOWER_OPTIMAL_RANGE) / (C.TOWER_FALLOFF_RANGE - C.TOWER_OPTIMAL_RANGE)) * towers.length

    let healAmount = 0

    if (creep) {

        for (let part of creep.body) {

            if (part.type == TOUGH && part.boost) {

                towerDamage = towerDamage * 0.3
                break
            }
        }
    }

    if (healers.length > 0) {

        for (let healer of healers) {

            for (let part in healer.body) {

                if (part.type == HEAL) {

                    if (part.boost == RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE) {

                        healAmount += 36

                    } else if (part.boost == RESOURCE_LEMERGIUM_ALKALIDE) {

                        healAmount += 24

                    } else if (part.boost == RESOURCE_LEMERGIUM_OXIDE) {

                        healAmount += 12
                    }

                    healAmount += 12
                }
            }
        }
    }

    let damagePossible = towerDamage - healAmount

    let i = 0

    while (damagePossible > 0 || i < 50) {

        distance++

    }

    if (distance > 0) {

        return distance
    } else {

        return false
    }
}

//creep.advancedPathing({ origin: creep.pos, goal: { pos: structure.pos, range: 1}, plainCost: false, swampCost: false, defaultCostMatrix: creep.room.memory.defaultCostMatrix, avoidStages: ["enemyRoom", "keeperRoom"], flee: false, cacheAmount: 2 })
Creep.prototype.advancedPathing = function(opts) {

    let creep = this

    let {
        creeps,
        powerCreeps,
        structures,
        costMatrixes,
    } = roomVariables(creep.room)

    if (creep.fatigue > 0) {

        return
    }

    if (!opts.plainCost) {

        opts.plainCost = 2
    }
    if (!opts.swampCost) {

        opts.swampCost = 6
    }
    if (!opts.avoidStages) {

        opts.avoidStages = []
    }
    if (!opts.flee) {

        opts.flee = false
    }
    if (!opts.cacheAmount) {

        opts.cacheAmount = 10
    }

    if (opts.origin.roomName != opts.goal.pos.roomName) {

        newRoute = Game.map.findRoute(opts.origin.roomName, opts.goal.pos.roomName, {
            routeCallback(roomName) {

                if (roomName == opts.goal.pos.roomName) {

                    return 1

                }
                if (Memory.rooms[roomName] && !opts.avoidStages.includes(Memory.rooms[roomName].stage)) {

                    return 1
                }

                return Infinity
            }
        })

        if (newRoute.length > 0) {

            opts.goal = { pos: new RoomPosition(25, 25, newRoute[0].room), range: 24 }
        }
    }

    if (opts.origin.roomName != opts.goal.pos.roomName) {

        const route = creep.memory.route

        if (!route) {
            newRoute = Game.map.findRoute(opts.origin.roomName, opts.goal.pos.roomName, {
                routeCallback(roomName) {

                    if (roomName == opts.goal.pos.roomName) {

                        return 1

                    }
                    if (Memory.rooms[roomName] && !opts.avoidStages.includes(Memory.rooms[roomName].stage)) {

                        return 1
                    }

                    return Infinity
                }
            })

            if (newRoute.length > 0) {

                creep.memory.route = newRoute
            }
        } else {

            (function() {

                for (let path of route) {

                    let i = 0

                    if (path.room == creep.room.name) {

                        i++

                        opts.goal = { pos: new RoomPosition(25, 25, route[i].room), range: 25 }
                        return
                    }
                }

                opts.goal = { pos: new RoomPosition(25, 25, route[0].room), range: 25 }
            })
        }
    }

    /* const path = creep.memory.path
    const cacheTo = creep.memory.cacheTo
    const lastRoom = creep.memory.lastRoom

    if (!path || !cacheTo || cacheTo <= Game.time || !lastRoom || lastRoom != creep.room.name) {

        let newPath = PathFinder.search(opts.origin, opts.goal, {
            plainCost: opts.plainCost,
            swampCost: opts.swampCost,
            maxRooms: 2,
            maxOps: 100000,
            flee: opts.flee,

            roomCallback: function(roomName) {

                let room = Game.rooms[roomName]

                if (!room) {

                    return false
                }

                let cm

                if (opts.defaultCostMatrix) {

                    cm = PathFinder.CostMatrix.deserialize(opts.defaultCostMatrix)

                    for (let creep of room.find(FIND_CREEPS)) {

                        cm.set(creep.pos.x, creep.pos.y, 255)
                    }

                    for (let creep of room.find(FIND_POWER_CREEPS)) {

                        cm.set(creep.pos.x, creep.pos.y, 255)
                    }
                } else {

                    cm = new PathFinder.CostMatrix

                    let constructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES, {
                        filter: s => s.structureType != STRUCTURE_CONTAINER && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_RAMPART
                    })

                    for (let site of constructionSites) {

                        cm.set(site.pos.x, site.pos.y, 255)
                    }

                    let ramparts = creep.room.find(FIND_MY_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_RAMPART
                    })

                    for (let rampart of ramparts) {

                        cm.set(rampart.pos.x, rampart.pos.y, 3)
                    }

                    let roads = creep.room.find(FIND_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_ROAD
                    })

                    for (let road of roads) {

                        cm.set(road.pos.x, road.pos.y, 1)
                    }

                    let structures = creep.room.find(FIND_STRUCTURES, {
                        filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_CONTAINER
                    })

                    for (let structure of structures) {

                        cm.set(structure.pos.x, structure.pos.y, 255)
                    }

                    let enemyStructures = creep.room.find(FIND_HOSTILE_STRUCTURES)

                    for (let structure of enemyStructures) {

                        cm.set(structure.pos.x, structure.pos.y, 255)
                    }

                    for (let creep of room.find(FIND_CREEPS)) {

                        cm.set(creep.pos.x, creep.pos.y, 255)
                    }

                    for (let creep of room.find(FIND_POWER_CREEPS)) {

                        cm.set(creep.pos.x, creep.pos.y, 255)
                    }
                }

                return cm
            }
        }).path

        if (!newPath || newPath == ERR_NO_PATH) {

            return
        }

        creep.memory.cacheTo = Game.time + opts.cacheAmount

        creep.memory.path = newPath

        creep.memory.lastRoom = creep.room.name

        //creep.moveByPath(path)
    }

    if (!path || path.length < 1) {

        return
    }

    let direction = creep.pos.getDirectionTo(new RoomPosition(path[0].x, path[0].y, creep.room.name))

    creep.move(direction)

    creep.memory.path = path.slice(1, path.length + 1)

    creep.room.visual.poly(path, { stroke: '#F4E637', strokeWidth: .15, opacity: .2, lineStyle: 'normal' }) */

    /*     creep.memory.path = path.slice(1, path.length + 1)

        creep.moveByPath(path) */

    /* creep.say("hey")

    for (let i of path) {

        creep.say("hi")

        i = 0

        let pos = new RoomPosition(path[i].x, path[i].y, creep.room.name)

        if (pos == creep.pos) {

            creep.say("guy")

            let direction = creep.pos.getDirectionTo(pos)

            creep.move(direction)
            break
        }

        i++
    }

    creep.say("why")

    let direction = creep.pos.getDirectionTo(new RoomPosition(path[0].x, path[0].y, creep.room.name))

    creep.move(direction) */

    let path = PathFinder.search(opts.origin, opts.goal, {
        plainCost: opts.plainCost,
        swampCost: opts.swampCost,
        maxRooms: 1,
        maxOps: 100000,
        flee: opts.flee,

        roomCallback: function(roomName) {

            let room = Game.rooms[roomName]

            if (!room) {

                return false
            }

            let cm

            if (opts.defaultCostMatrix) {

                cm = PathFinder.CostMatrix.deserialize(opts.defaultCostMatrix)

                for (let creep of creeps.allCreeps) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }

                for (let creep of room.find(FIND_POWER_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }
            } else {

                cm = new PathFinder.CostMatrix

                let structures = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_CONTAINER
                })

                for (let structure of structures) {

                    cm.set(structure.pos.x, structure.pos.y, 255)
                }

                let roads = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_ROAD
                })

                for (let road of roads) {

                    cm.set(road.pos.x, road.pos.y, 1)
                }

                for (let creep of creeps.allCreeps) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }

                for (let creep of room.find(FIND_POWER_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }
            }

            return cm
        }
    }).path

    creep.memory.path = path

    creep.moveByPath(path)

    creep.room.visual.poly(path, { stroke: '#F4E637', strokeWidth: .15, opacity: .2, lineStyle: 'normal' })

}
Creep.prototype.roadPathing = function(origin, goal) {

    creep = this

    var path = PathFinder.search(origin, goal, {
        plainCost: 3,
        swampCost: 8,

        roomCallback: function(roomName) {

            let room = Game.rooms[roomName]

            if (!room) return

            let cm

            if (room.memory.defaultCostMatrix) {

                cm = PathFinder.CostMatrix.deserialize(room.memory.defaultCostMatrix)

                for (let creep of room.find(FIND_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }

                for (let creep of room.find(FIND_POWER_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }
            } else {

                cm = new PathFinder.CostMatrix

                let constructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES, {
                    filter: s => s.structureType != STRUCTURE_CONTAINER && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_RAMPART
                })

                for (let site of constructionSites) {

                    cm.set(site.pos.x, site.pos.y, 255)
                }

                let ramparts = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_RAMPART
                })

                for (let rampart of ramparts) {

                    cm.set(rampart.pos.x, rampart.pos.y, 3)
                }

                let roads = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_ROAD
                })

                for (let road of roads) {

                    cm.set(road.pos.x, road.pos.y, 1)
                }

                let structures = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_CONTAINER
                })

                for (let structure of structures) {

                    cm.set(structure.pos.x, structure.pos.y, 255)
                }

                let enemyStructures = creep.room.find(FIND_HOSTILE_STRUCTURES)

                for (let structure of enemyStructures) {

                    cm.set(structure.pos.x, structure.pos.y, 255)
                }

                for (let creep of room.find(FIND_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }

                for (let creep of room.find(FIND_POWER_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }
            }

            return cm
        }
    }).path

    creep.memory.path = path

    creep.moveByPath(creep.memory.path)

    //new RoomVisual(creep.room.name).poly(creep.memory.path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })
}
Creep.prototype.offRoadPathing = function(origin, goal) {

    creep = this

    var path = PathFinder.search(origin, goal, {
        plainCost: 1,
        swampCost: 8,

        roomCallback: function(roomName) {

            let room = Game.rooms[roomName]

            if (!room) return

            let cm

            if (room.memory.defaultCostMatrix) {

                cm = PathFinder.CostMatrix.deserialize(room.memory.defaultCostMatrix)

                for (let creep of room.find(FIND_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }

                for (let creep of room.find(FIND_POWER_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }
            } else {

                cm = new PathFinder.CostMatrix

                let constructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES, {
                    filter: s => s.structureType != STRUCTURE_CONTAINER && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_RAMPART
                })

                for (let site of constructionSites) {

                    cm.set(site.pos.x, site.pos.y, 255)
                }

                let ramparts = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_RAMPART
                })

                for (let rampart of ramparts) {

                    cm.set(rampart.pos.x, rampart.pos.y, 3)
                }

                let roads = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_ROAD
                })

                for (let road of roads) {

                    cm.set(road.pos.x, road.pos.y, 1)
                }

                let structures = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_CONTAINER
                })

                for (let structure of structures) {

                    cm.set(structure.pos.x, structure.pos.y, 255)
                }

                let enemyStructures = creep.room.find(FIND_HOSTILE_STRUCTURES)

                for (let structure of enemyStructures) {

                    cm.set(structure.pos.x, structure.pos.y, 255)
                }

                for (let creep of room.find(FIND_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }

                for (let creep of room.find(FIND_POWER_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }
            }

            return cm
        }
    }).path

    creep.memory.path = path

    creep.moveByPath(creep.memory.path)

    new RoomVisual(creep.room.name).poly(creep.memory.path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })
}
Creep.prototype.intraRoomPathing = function(origin, goal) {

    creep = this

    var path = PathFinder.search(origin, goal, {
        plainCost: 3,
        swampCost: 8,
        maxRooms: 1,

        roomCallback: function(roomName) {

            let room = Game.rooms[roomName]

            if (!room) return

            let cm

            if (room.memory.defaultCostMatrix) {

                cm = PathFinder.CostMatrix.deserialize(room.memory.defaultCostMatrix)

                for (let creep of room.find(FIND_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }

                for (let creep of room.find(FIND_POWER_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }
            } else {

                cm = new PathFinder.CostMatrix

                let constructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES, {
                    filter: s => s.structureType != STRUCTURE_CONTAINER && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_RAMPART
                })

                for (let site of constructionSites) {

                    cm.set(site.pos.x, site.pos.y, 255)
                }

                let ramparts = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_RAMPART
                })

                for (let rampart of ramparts) {

                    cm.set(rampart.pos.x, rampart.pos.y, 3)
                }

                let roads = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_ROAD
                })

                for (let road of roads) {

                    cm.set(road.pos.x, road.pos.y, 1)
                }

                let structures = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_CONTAINER
                })

                for (let structure of structures) {

                    cm.set(structure.pos.x, structure.pos.y, 255)
                }

                let enemyStructures = creep.room.find(FIND_HOSTILE_STRUCTURES)

                for (let structure of enemyStructures) {

                    cm.set(structure.pos.x, structure.pos.y, 255)
                }

                for (let creep of room.find(FIND_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }

                for (let creep of room.find(FIND_POWER_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }
            }

            return cm
        }
    }).path

    creep.memory.path = path

    creep.moveByPath(creep.memory.path)

    new RoomVisual(creep.room.name).poly(creep.memory.path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })
}
Creep.prototype.onlySafeRoomPathing = function(origin, goal, avoidStages) {

    creep = this

    avoidStages.push("allyRoom")

    var allowedRooms = {
        [origin.room.name]: true
    }

    let route = Game.map.findRoute(origin.room.name, goal[0].pos.roomName, {
        routeCallback(roomName) {

            if (roomName == goal[0].pos.roomName) {

                allowedRooms[roomName] = true
                return 1

            }
            if (Memory.rooms[roomName] && !avoidStages.includes(Memory.rooms[roomName].stage)) {

                allowedRooms[roomName] = true
                return 1
            }

            return Infinity
        }
    })

    if (!route) {

        return
    }
    if (route.length == 0) {

        return
    }

    creep.memory.route = route

    goal = { pos: new RoomPosition(25, 25, route[0].room), range: 24 }

    var path = PathFinder.search(origin.pos, goal, {
        plainCost: 3,
        swampCost: 8,
        maxRooms: 1,
        maxOps: 10000,

        roomCallback: function(roomName) {

            let room = Game.rooms[roomName]

            if (!room) return false

            if (!allowedRooms[roomName]) return false

            let cm

            if (room.memory.defaultCostMatrix) {

                cm = PathFinder.CostMatrix.deserialize(room.memory.defaultCostMatrix)

                for (let creep of room.find(FIND_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }

                for (let creep of room.find(FIND_POWER_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }
            } else {

                cm = new PathFinder.CostMatrix

                let constructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES, {
                    filter: s => s.structureType != STRUCTURE_CONTAINER && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_RAMPART
                })

                for (let site of constructionSites) {

                    cm.set(site.pos.x, site.pos.y, 255)
                }

                let ramparts = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_RAMPART
                })

                for (let rampart of ramparts) {

                    cm.set(rampart.pos.x, rampart.pos.y, 3)
                }

                let roads = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_ROAD
                })

                for (let road of roads) {

                    cm.set(road.pos.x, road.pos.y, 1)
                }

                let structures = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_CONTAINER
                })

                for (let structure of structures) {

                    cm.set(structure.pos.x, structure.pos.y, 255)
                }

                let enemyStructures = creep.room.find(FIND_HOSTILE_STRUCTURES)

                for (let structure of enemyStructures) {

                    cm.set(structure.pos.x, structure.pos.y, 255)
                }

                for (let creep of room.find(FIND_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }

                for (let creep of room.find(FIND_POWER_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }
            }

            return cm
        }
    }).path

    creep.memory.path = path

    creep.moveByPath(path)

    /*     let direction = creep.pos.getDirectionTo(path[0])
        
        creep.move(direction) */

    new RoomVisual(creep.room.name).poly(creep.memory.path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })

    /*     for (let pos of path) {

            let room = Game.rooms[pos.roomName]

            if (room) {

                room.visual.rect(pos.x - 0.5, pos.y - 0.5, 1, 1, { opacity: 0.2, stroke: "yellow", fill: "yellow" })
            } else {

                break
            }
        } */
}

Creep.prototype.findSafeDistance = function(origin, goal, avoidStages) {

    let creep = TERMINAL_HITS

    let route = Game.map.findRoute(origin.roomName, goal[0].pos.roomName, {
        routeCallback(roomName) {

            if (roomName == goal[0].pos.roomName) {

                return 1

            }
            if (Memory.rooms[roomName] && !avoidStages.includes(Memory.rooms[roomName].stage)) {

                return 1

            }

            return Infinity
        }
    })

    return route.length
}
Creep.prototype.rampartPathing = function(origin, goal) {

    creep = this

    var path = PathFinder.search(origin, goal, {
        plainCost: 20,
        swampCost: 60,
        maxRooms: 1,

        roomCallback: function(roomName) {

            let room = Game.rooms[roomName]

            if (!room) return

            let cm

            cm = new PathFinder.CostMatrix

            let constructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES, {
                filter: s => s.structureType != STRUCTURE_CONTAINER && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_RAMPART
            })

            for (let site of constructionSites) {

                cm.set(site.pos.x, site.pos.y, 255)
            }

            let ramparts = creep.room.find(FIND_MY_STRUCTURES, {
                filter: s => s.structureType == STRUCTURE_RAMPART
            })

            for (let rampart of ramparts) {

                cm.set(rampart.pos.x, rampart.pos.y, 1)
            }

            let roads = creep.room.find(FIND_STRUCTURES, {
                filter: s => s.structureType == STRUCTURE_ROAD
            })

            for (let road of roads) {

                cm.set(road.pos.x, road.pos.y, 10)
            }

            let structures = creep.room.find(FIND_STRUCTURES, {
                filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_CONTAINER
            })

            for (let structure of structures) {

                cm.set(structure.pos.x, structure.pos.y, 255)
            }

            for (let creep of room.find(FIND_CREEPS)) {

                cm.set(creep.pos.x, creep.pos.y, 255)
            }

            for (let creep of room.find(FIND_POWER_CREEPS)) {

                cm.set(creep.pos.x, creep.pos.y, 255)
            }

            return cm
        }
    }).path

    creep.memory.path = path

    creep.moveByPath(creep.memory.path)

    new RoomVisual(creep.room.name).poly(creep.memory.path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })
}
Creep.prototype.creepFlee = function(origin, target) {

    creep = this

    var path = PathFinder.search(origin, target, {
        plainCost: 1,
        swampCost: 8,
        maxRooms: 1,
        flee: true,

        roomCallback: function(roomName) {

            let room = Game.rooms[roomName]

            if (!room) return

            let cm

            if (room.memory.defaultCostMatrix) {

                cm = PathFinder.CostMatrix.deserialize(room.memory.defaultCostMatrix)

                for (let creep of room.find(FIND_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }

                for (let creep of room.find(FIND_POWER_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }
            } else {

                cm = new PathFinder.CostMatrix

                let constructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES, {
                    filter: s => s.structureType != STRUCTURE_CONTAINER && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_RAMPART
                })

                for (let site of constructionSites) {

                    cm.set(site.pos.x, site.pos.y, 255)
                }

                let ramparts = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_RAMPART
                })

                for (let rampart of ramparts) {

                    cm.set(rampart.pos.x, rampart.pos.y, 3)
                }

                let roads = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_ROAD
                })

                for (let road of roads) {

                    cm.set(road.pos.x, road.pos.y, 1)
                }

                let structures = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_CONTAINER
                })

                for (let structure of structures) {

                    cm.set(structure.pos.x, structure.pos.y, 255)
                }

                let enemyStructures = creep.room.find(FIND_HOSTILE_STRUCTURES)

                for (let structure of enemyStructures) {

                    cm.set(structure.pos.x, structure.pos.y, 255)
                }

                for (var x = -1; x < 50; ++x) {
                    for (var y = -1; y < 50; ++y) {

                        if (x <= 0 || x >= 49 || y <= 0 || y >= 49) {

                            cm.set(x, y, 255)
                        }
                    }
                }

                for (let creep of room.find(FIND_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }

                for (let creep of room.find(FIND_POWER_CREEPS)) {

                    cm.set(creep.pos.x, creep.pos.y, 255)
                }
            }

            return cm
        }
    }).path

    creep.memory.path = path

    creep.moveByPath(creep.memory.path)

    new RoomVisual(creep.room.name).poly(creep.memory.path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })
}