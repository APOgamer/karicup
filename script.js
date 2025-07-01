// Estructura de datos para almacenar jugadores
let players = [];
let teams = [];
let editingPlayerIndex = -1;

// Roles disponibles
const ROLES = {
    1: "Hard Carry",
    2: "Midlane", 
    3: "Offlane",
    4: "Soft Support",
    5: "Hard Support"
};

// Función para agregar un jugador
function addPlayer() {
    const name = document.getElementById('playerName').value.trim();
    const id = document.getElementById('playerID').value.trim();
    const mmr = parseInt(document.getElementById('playerMMR').value);
    const role = parseInt(document.getElementById('playerRole').value);
    
    if (!name || isNaN(mmr) || isNaN(role)) {
        alert('Por favor completa todos los campos correctamente');
        return;
    }
    
    // Verificar si el jugador ya existe
    const existingPlayer = players.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (existingPlayer) {
        alert('Este jugador ya existe en la lista');
        return;
    }
    
    const player = {
        name: name,
        id: id || null,
        mmr: mmr,
        role: role,
        index: players.length
    };
    
    players.push(player);
    
    // Limpiar formulario
    document.getElementById('playerName').value = '';
    document.getElementById('playerID').value = '';
    document.getElementById('playerMMR').value = '';
    document.getElementById('playerRole').value = '1';
    
    // Guardar en localStorage
    savePlayers();
    
    // Generar equipos automáticamente si hay suficientes jugadores
    if (players.length >= 5) {
        generateTeams();
        displayTeams();
        updateStats();
        console.log(`Jugador ${name} agregado y equipos regenerados automáticamente`);
    } else {
        // Si no hay suficientes jugadores, solo mostrar la lista actual
        displayTeams();
        updateStats();
        console.log(`Jugador ${name} agregado (se necesitan ${5 - players.length} jugadores más para formar equipos)`);
    }
}

// Función para generar equipos balanceados con MMR mínimo
function generateTeams() {
    if (players.length < 5) {
        document.getElementById('teamsContainer').innerHTML = 
            '<p style="text-align: center; color: #ffd700;">Se necesitan al menos 5 jugadores para formar equipos</p>';
        document.getElementById('statsContainer').innerHTML = '';
        return;
    }
    
    // Ordenar jugadores por MMR (descendente)
    const sortedPlayers = [...players].sort((a, b) => b.mmr - a.mmr);
    
    // Calcular número de equipos
    const numTeams = Math.floor(players.length / 5);
    
    console.log(`Generando equipos: ${players.length} jugadores → ${numTeams} equipos`);
    
    // Algoritmo matemático avanzado para balance perfecto
    teams = createBalancedTeams(sortedPlayers, numTeams);
    
    // Ordenar jugadores dentro de cada equipo por rol
    teams.forEach(team => {
        team.players.sort((a, b) => a.role - b.role);
    });
    
    // Verificación final: asegurar que todos los equipos tengan exactamente 5 jugadores
    enforceExactTeamSize(teams);
    
    // Verificación final
    const assignedPlayers = teams.flatMap(team => team.players);
    const unassignedCount = players.length - assignedPlayers.length;
    
    if (unassignedCount > 0) {
        console.log(`⚠️ ADVERTENCIA: ${unassignedCount} jugadores quedaron sin asignar`);
        alert(`Se generaron ${teams.length} equipos, pero ${unassignedCount} jugadores quedaron sin asignar. Revisa la sección "Jugadores Sin Asignar".`);
    } else {
        console.log(`✅ Éxito: Todos los ${players.length} jugadores asignados a ${teams.length} equipos`);
    }
    
    // Mostrar equipos
    displayTeams();
    
    // Mostrar estadísticas
    updateStats();
    
    console.log(`Equipos generados: ${teams.length} equipos con ${teams.reduce((sum, team) => sum + team.players.length, 0)} jugadores asignados`);
}

// Algoritmo matemático para crear equipos perfectamente balanceados
function createBalancedTeams(players, numTeams) {
    const totalMMR = players.reduce((sum, p) => sum + p.mmr, 0);
    const targetMMR = Math.floor(totalMMR / numTeams);
    
    console.log(`=== DEBUGGING INICIO ===`);
    console.log(`Total MMR: ${totalMMR}, Target por equipo: ${targetMMR}`);
    console.log(`Número de equipos: ${numTeams}`);
    console.log(`Jugadores totales: ${players.length}`);
    
    // Algoritmo de snake draft por rol para equipos balanceados
    let teams = createTeamsWithDynamicProgramming(players, numTeams, targetMMR);
    
    console.log(`=== DESPUÉS DE ASIGNACIÓN INICIAL ===`);
    teams.forEach((team, index) => {
        console.log(`Equipo ${index + 1}: ${team.players.length} jugadores, MMR: ${team.totalMMR}, Target: ${targetMMR}`);
    });
    
    // Si no se logró balance perfecto, hacer optimización agresiva
    if (!isTeamsBalanced(teams, targetMMR)) {
        console.log(`=== INICIANDO OPTIMIZACIÓN ===`);
        aggressiveOptimization(teams, targetMMR);
    }
    
    console.log(`=== RESULTADO FINAL ===`);
    teams.forEach((team, index) => {
        console.log(`Equipo ${index + 1}: ${team.players.length} jugadores, MMR: ${team.totalMMR}, Target: ${targetMMR}, Diferencia: ${Math.abs(team.totalMMR - targetMMR)}`);
    });
    
    // VERIFICACIÓN FINAL: Asegurar que todos los jugadores estén asignados
    const assignedPlayers = teams.flatMap(team => team.players);
    const unassignedPlayers = players.filter(player => 
        !assignedPlayers.some(assigned => assigned.index === player.index)
    );
    
    if (unassignedPlayers.length > 0) {
        console.log(`⚠️ ADVERTENCIA: ${unassignedPlayers.length} jugadores sin asignar:`, unassignedPlayers.map(p => p.name));
        
        // Asignar jugadores restantes a equipos con espacio (máximo 5 por equipo)
        for (const player of unassignedPlayers) {
            let assigned = false;
            
            // Buscar equipo con menos jugadores (priorizar equipos incompletos)
            teams.sort((a, b) => {
                // Priorizar equipos con menos de 5 jugadores
                if (a.players.length < 5 && b.players.length >= 5) return -1;
                if (a.players.length >= 5 && b.players.length < 5) return 1;
                // Si ambos tienen menos de 5, priorizar el que tiene menos jugadores
                if (a.players.length < 5 && b.players.length < 5) {
                    return a.players.length - b.players.length;
                }
                // Si ambos tienen 5 o más, priorizar el que tiene menos jugadores
                return a.players.length - b.players.length;
            });
            
            for (const team of teams) {
                // Solo asignar si el equipo tiene menos de 5 jugadores
                if (team.players.length < 5) {
                    team.players.push(player);
                    team.totalMMR += player.mmr;
                    team.roles.add(player.role);
                    assigned = true;
                    console.log(`✅ Jugador ${player.name} asignado de emergencia a equipo con ${team.players.length} jugadores`);
                    break;
                }
            }
            
            if (!assigned) {
                console.log(`❌ ERROR: No se pudo asignar ${player.name} - todos los equipos están llenos (5 jugadores)`);
            }
        }
    } else {
        console.log(`✅ Todos los ${players.length} jugadores han sido asignados correctamente`);
    }
    
    // 8. Optimización final agresiva con múltiples estrategias
    console.log("🚀 Iniciando optimización agresiva final...");
    teams = optimizeTeams(teams, targetMMR);

    // 9. Verificación final: asegurar que ningún equipo tenga más de 5 jugadores
    enforceExactTeamSize(teams);

    // 10. Optimización global entre todos los equipos
    globalTeamOptimization(teams, targetMMR);

    // 11. Optimización matemática avanzada con programación dinámica
    advancedMathematicalOptimization(teams, targetMMR);

    // 12. Optimización final con simulated annealing
    simulatedAnnealingOptimization(teams, targetMMR);

    // 13. Revisión final: evitar doble core, priorizar doble support
    for (const team of teams) {
        // Contar roles
        const roleCount = {1:0, 2:0, 3:0, 4:0, 5:0};
        for (const p of team.players) roleCount[p.role]++;
        // Si hay doble core (1,2,3)
        for (let core of [1,2,3]) {
            if (roleCount[core] > 1) {
                // Buscar equipo con doble support (4 o 5)
                let foundSwap = false;
                for (const otherTeam of teams) {
                    if (otherTeam === team) continue;
                    const otherRoleCount = {1:0, 2:0, 3:0, 4:0, 5:0};
                    for (const p of otherTeam.players) otherRoleCount[p.role]++;
                    for (let support of [4,5]) {
                        if (otherRoleCount[support] > 1) {
                            // Hacer swap: core <-> support de menor MMR
                            const corePlayer = team.players.filter(p => p.role === core).sort((a,b)=>a.mmr-b.mmr)[0];
                            const supportPlayer = otherTeam.players.filter(p => p.role === support).sort((a,b)=>a.mmr-b.mmr)[0];
                            if (corePlayer && supportPlayer) {
                                // Swap
                                team.players[team.players.indexOf(corePlayer)] = supportPlayer;
                                otherTeam.players[otherTeam.players.indexOf(supportPlayer)] = corePlayer;
                                team.totalMMR = team.totalMMR - corePlayer.mmr + supportPlayer.mmr;
                                otherTeam.totalMMR = otherTeam.totalMMR - supportPlayer.mmr + corePlayer.mmr;
                                foundSwap = true;
                                break;
                            }
                        }
                    }
                    if (foundSwap) break;
                }
                // Si no hay doble support, buscar el equipo con el support de menor MMR
                if (!foundSwap) {
                    let minSupport = null, minTeam = null;
                    for (const otherTeam of teams) {
                        if (otherTeam === team) continue;
                        for (let support of [4,5]) {
                            const supportPlayers = otherTeam.players.filter(p => p.role === support);
                            for (const sp of supportPlayers) {
                                if (!minSupport || sp.mmr < minSupport.mmr) {
                                    minSupport = sp;
                                    minTeam = otherTeam;
                                }
                            }
                        }
                    }
                    if (minSupport) {
                        const corePlayer = team.players.filter(p => p.role === core).sort((a,b)=>a.mmr-b.mmr)[0];
                        if (corePlayer) {
                            team.players[team.players.indexOf(corePlayer)] = minSupport;
                            minTeam.players[minTeam.players.indexOf(minSupport)] = corePlayer;
                            team.totalMMR = team.totalMMR - corePlayer.mmr + minSupport.mmr;
                            minTeam.totalMMR = minTeam.totalMMR - minSupport.mmr + corePlayer.mmr;
                        }
                    }
                }
            }
        }
    }

    return teams;
}

// Algoritmo óptimo para Dota 2 competitivo: balancea MMR y roles clave
function createTeamsWithDynamicProgramming(players, numTeams, targetMMR) {
    const teams = [];
    for (let i = 0; i < numTeams; i++) {
        teams.push({
            players: [],
            totalMMR: 0,
            roles: new Set()
        });
    }

    // 1. Ordenar todos los jugadores por MMR descendente
    const sortedPlayers = [...players].sort((a, b) => b.mmr - a.mmr);
    // 2. Separar por roles
    const carries = sortedPlayers.filter(p => p.role === 1);
    const mids = sortedPlayers.filter(p => p.role === 2);
    const offlanes = sortedPlayers.filter(p => p.role === 3);
    let supports4 = sortedPlayers.filter(p => p.role === 4);
    let supports5 = sortedPlayers.filter(p => p.role === 5);

    // 3. Asignar Carry/Mid más altos a cada equipo (alternando)
    let carryIndex = 0, midIndex = 0;
    for (let i = 0; i < numTeams; i++) {
        // Alternar: par = Carry, impar = Mid
        let player = (i % 2 === 0 && carryIndex < carries.length) ? carries[carryIndex++] : (midIndex < mids.length ? mids[midIndex++] : null);
        if (!player && carryIndex < carries.length) player = carries[carryIndex++];
        if (!player && midIndex < mids.length) player = mids[midIndex++];
        if (player) {
            teams[i].players.push(player);
            teams[i].totalMMR += player.mmr;
            teams[i].roles.add(player.role);
        }
    }

    // 4. Asignar Carry/Mid restantes (si sobran) a equipos con menos MMR
    let restCores = [];
    while (carryIndex < carries.length) restCores.push(carries[carryIndex++]);
    while (midIndex < mids.length) restCores.push(mids[midIndex++]);
    restCores.forEach(player => {
        teams.sort((a, b) => a.totalMMR - b.totalMMR);
        for (const team of teams) {
            if (team.players.length < 5 && !team.roles.has(player.role)) {
                team.players.push(player);
                team.totalMMR += player.mmr;
                team.roles.add(player.role);
                break;
            }
        }
    });

    // 5. Asignar los MMR más bajos a supports 4 y 5 (alternando, flexibles)
    supports4 = supports4.sort((a, b) => a.mmr - b.mmr);
    supports5 = supports5.sort((a, b) => a.mmr - b.mmr);
    let s4Index = 0, s5Index = 0;
    for (let i = 0; i < numTeams; i++) {
        // Alternar: par = 4, impar = 5
        let player = (i % 2 === 0 && s4Index < supports4.length) ? supports4[s4Index++] : (s5Index < supports5.length ? supports5[s5Index++] : null);
        // Si no hay del rol, permitir flexibilidad entre 4 y 5
        if (!player && s4Index < supports4.length) player = supports4[s4Index++];
        if (!player && s5Index < supports5.length) player = supports5[s5Index++];
        if (player) {
            teams[i].players.push(player);
            teams[i].totalMMR += player.mmr;
            teams[i].roles.add(player.role);
        }
    }
    // Asignar supports restantes a equipos con menos MMR y menos supports
    let restSupports = [];
    while (s4Index < supports4.length) restSupports.push(supports4[s4Index++]);
    while (s5Index < supports5.length) restSupports.push(supports5[s5Index++]);
    restSupports.forEach(player => {
        teams.sort((a, b) => a.totalMMR - b.totalMMR);
        for (const team of teams) {
            if (team.players.length < 5) {
                team.players.push(player);
                team.totalMMR += player.mmr;
                team.roles.add(player.role);
                break;
            }
        }
    });

    // 6. Asignar offlanes (MMR intermedios)
    let offIndex = 0;
    for (let i = 0; i < numTeams; i++) {
        if (offIndex < offlanes.length) {
            teams[i].players.push(offlanes[offIndex]);
            teams[i].totalMMR += offlanes[offIndex].mmr;
            teams[i].roles.add(offlanes[offIndex].role);
            offIndex++;
        }
    }
    // Asignar offlanes restantes a equipos con menos MMR
    while (offIndex < offlanes.length) {
        teams.sort((a, b) => a.totalMMR - b.totalMMR);
        for (const team of teams) {
            if (team.players.length < 5) {
                team.players.push(offlanes[offIndex]);
                team.totalMMR += offlanes[offIndex].mmr;
                team.roles.add(offlanes[offIndex].role);
                offIndex++;
                break;
            }
        }
    }

    // 7. Verificación final: asignar cualquier jugador restante a equipos con espacio
    const assignedPlayers = teams.flatMap(team => team.players);
    const unassignedPlayers = players.filter(player =>
        !assignedPlayers.some(assigned => assigned.index === player.index)
    );
    if (unassignedPlayers.length > 0) {
        for (const player of unassignedPlayers) {
            teams.sort((a, b) => a.players.length - b.players.length);
            for (const team of teams) {
                if (team.players.length < 5) {
                    team.players.push(player);
                    team.totalMMR += player.mmr;
                    team.roles.add(player.role);
                    break;
                }
            }
        }
    }

    return teams;
}

// Optimización para reducir la desviación estándar de MMR entre equipos
function optimizeTeamsStdDev(teams, targetMMR) {
    let improved = true;
    let maxTries = 200; // Aumentar significativamente las iteraciones
    
    while (improved && maxTries-- > 0) {
        improved = false;
        
        // Buscar los dos equipos más desbalanceados
        let maxTeam = teams[0], minTeam = teams[0];
        let maxMMR = -Infinity, minMMR = Infinity;
        
        for (const team of teams) {
            if (team.players.length === 5) {
                if (team.totalMMR > maxMMR) {
                    maxMMR = team.totalMMR;
                    maxTeam = team;
                }
                if (team.totalMMR < minMMR) {
                    minMMR = team.totalMMR;
                    minTeam = team;
                }
            }
        }
        
        const currentDifference = maxMMR - minMMR;
        
        // Si la diferencia es muy pequeña, terminar
        if (currentDifference < 50) {
            console.log('Diferencia muy pequeña en optimizeTeamsStdDev, terminando');
            break;
        }
        
        // Intentar intercambiar jugadores de rol igual
        let bestSwap = null;
        let bestImprovement = 0;
        
        for (const p1 of maxTeam.players) {
            for (const p2 of minTeam.players) {
                if (p1.role !== p2.role) continue;
                
                // Simular swap
                let newMaxMMR = maxTeam.totalMMR - p1.mmr + p2.mmr;
                let newMinMMR = minTeam.totalMMR - p2.mmr + p1.mmr;
                let newDifference = Math.abs(newMaxMMR - newMinMMR);
                let improvement = currentDifference - newDifference;
                
                // Solo considerar mejoras significativas
                if (improvement > 20) {
                    let mmrs = teams.map(t => {
                        if (t === maxTeam) return newMaxMMR;
                        if (t === minTeam) return newMinMMR;
                        return t.totalMMR;
                    });
                    let newStdDev = stdDev(mmrs);
                    let currentStdDev = stdDev(teams.map(t => t.totalMMR));
                    
                    // Priorizar mejoras en la diferencia total
                    let totalScore = improvement * 10 + (currentStdDev - newStdDev) * 100;
                    
                    if (totalScore > bestImprovement) {
                        bestImprovement = totalScore;
                        bestSwap = { p1, p2, newMaxMMR, newMinMMR };
                    }
                }
            }
        }
        
        if (bestSwap) {
            // Realizar swap
            let idx1 = maxTeam.players.indexOf(bestSwap.p1);
            let idx2 = minTeam.players.indexOf(bestSwap.p2);
            maxTeam.players[idx1] = bestSwap.p2;
            minTeam.players[idx2] = bestSwap.p1;
            maxTeam.totalMMR = bestSwap.newMaxMMR;
            minTeam.totalMMR = bestSwap.newMinMMR;
            improved = true;
            
            console.log(`📊 Swap stdDev: ${bestSwap.p1.name} (${bestSwap.p1.mmr}) ↔ ${bestSwap.p2.name} (${bestSwap.p2.mmr}) - Mejora: ${bestImprovement.toFixed(2)}`);
        }
    }
    
    console.log(`Optimización stdDev completada en ${200 - maxTries} iteraciones`);
}

function stdDev(arr) {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return Math.sqrt(arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length);
}

// Función para calcular score de balance interno de un equipo
function calculateTeamBalanceScore(team, targetMMR) {
    if (team.players.length === 0) return 0;
    
    const mmrs = team.players.map(p => p.mmr);
    const avgMMR = mmrs.reduce((sum, mmr) => sum + mmr, 0) / mmrs.length;
    
    // Calcular desviación estándar interna
    const variance = mmrs.reduce((sum, mmr) => sum + Math.pow(mmr - avgMMR, 2), 0) / mmrs.length;
    const stdDev = Math.sqrt(variance);
    
    // Calcular desviación del target (PRIORIDAD PRINCIPAL)
    const targetDeviation = Math.abs(team.totalMMR - targetMMR);
    
    // Score más alto = mejor equipo
    let score = 10000;
    
    // PRIORIDAD 1: Balance del total MMR (peso muy alto)
    score -= targetDeviation * 5.0; // Aumentar peso del balance total
    
    // PRIORIDAD 2: Penalización severa para equipos con más de 5 jugadores
    if (team.players.length > 5) {
        score -= (team.players.length - 5) * 10000; // Penalización muy severa
    } else if (team.players.length < 5) {
        score -= (5 - team.players.length) * 5000; // Penalización por equipos incompletos
    }
    
    // PRIORIDAD 3: BONUS por equipos con MMR muy alto y muy bajo juntos (nueva lógica)
    const maxMMR = Math.max(...mmrs);
    const minMMR = Math.min(...mmrs);
    const mmrRange = maxMMR - minMMR;
    
    // Bonus por tener MMR muy alto y muy bajo en el mismo equipo
    if (maxMMR >= 7000 && minMMR <= 2000) {
        score += 5000; // Bonus muy alto por balance extremo
    } else if (maxMMR >= 6000 && minMMR <= 3000) {
        score += 3000; // Bonus alto por balance moderado
    } else if (maxMMR >= 5000 && minMMR <= 4000) {
        score += 1000; // Bonus bajo por balance suave
    }
    
    // Penalización por equipos con MMR muy similares (todos altos o todos bajos)
    if (mmrRange < 1000 && maxMMR > 5000) {
        score -= 8000; // Penalización muy severa por equipo de solo altos MMR
    } else if (mmrRange < 1000 && maxMMR < 3000) {
        score -= 6000; // Penalización severa por equipo de solo bajos MMR
    }
    
    // PRIORIDAD 4: Distribución interna (peso menor)
    score -= stdDev * 0.1; // Reducir peso de desviación estándar
    
    // Bonus por roles únicos
    score += team.roles.size * 100;
    
    // Bonus por equipos con MMR más uniforme (peso menor)
    score -= mmrRange * 0.01; // Reducir penalización del rango
    
    return score;
}

// Verificar si los equipos están balanceados
function isTeamsBalanced(teams, targetMMR) {
    const deviations = teams.map(team => Math.abs(team.totalMMR - targetMMR));
    const maxDeviation = Math.max(...deviations);
    const avgDeviation = deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;
    
    console.log(`Verificación de balance: Max desviación: ${maxDeviation}, Promedio: ${avgDeviation.toFixed(2)}, Target: ${targetMMR}`);
    
    // Considerar balanceado si la desviación máxima es menor al 10% del target
    const isBalanced = maxDeviation < targetMMR * 0.1 && avgDeviation < targetMMR * 0.05;
    console.log(`¿Está balanceado? ${isBalanced}`);
    
    return isBalanced;
}

// Optimización agresiva para balancear equipos
function aggressiveOptimization(teams, targetMMR) {
    let iterations = 0;
    const maxIterations = 500; // Aumentar significativamente las iteraciones
    
    while (iterations < maxIterations) {
        iterations++;
        
        // PRIORIDAD 1: Encontrar equipos con mayor y menor MMR total (solo equipos completos de 5)
        let maxTeamIndex = -1;
        let minTeamIndex = -1;
        let maxMMR = -Infinity;
        let minMMR = Infinity;
        
        for (let i = 0; i < teams.length; i++) {
            if (teams[i].players.length === 5) {
                if (teams[i].totalMMR > maxMMR) {
                    maxMMR = teams[i].totalMMR;
                    maxTeamIndex = i;
                }
                if (teams[i].totalMMR < minMMR) {
                    minMMR = teams[i].totalMMR;
                    minTeamIndex = i;
                }
            }
        }
        
        // Si no hay equipos completos de 5 jugadores, terminar
        if (maxTeamIndex === -1 || minTeamIndex === -1) {
            console.log('No hay equipos completos de 5 jugadores para optimizar');
            break;
        }
        
        // Calcular diferencia actual
        const currentDifference = maxMMR - minMMR;
        console.log(`Iteración ${iterations}: Diferencia actual = ${currentDifference} (${maxMMR} - ${minMMR})`);
        
        // Si la diferencia de MMR total es muy pequeña, terminar
        if (currentDifference < 50) {
            console.log('Diferencia de MMR total muy pequeña (< 50), terminando optimización');
            break;
        }
        
        // Intentar intercambiar jugadores para mejorar balance del total
        const maxTeam = teams[maxTeamIndex];
        const minTeam = teams[minTeamIndex];
        
        let bestSwap = null;
        let bestImprovement = 0;
        
        // Priorizar intercambios que mejoren el balance del total MMR
        const rolePriority = [4, 5, 3, 2, 1]; // Roles menos importantes primero
        
        for (const role1 of rolePriority) {
            for (const role2 of rolePriority) {
                // Buscar jugadores con estos roles en cada equipo
                const player1 = maxTeam.players.find(p => p.role === role1);
                const player2 = minTeam.players.find(p => p.role === role2);
                
                if (!player1 || !player2) continue;
                
                // Verificar que el intercambio no rompa roles
                if (maxTeam.roles.has(player2.role) || minTeam.roles.has(player1.role)) continue;
                
                // Calcular MMR después del intercambio
                const newMaxMMR = maxTeam.totalMMR - player1.mmr + player2.mmr;
                const newMinMMR = minTeam.totalMMR - player2.mmr + player1.mmr;
                
                // PRIORIDAD: Mejorar balance del total MMR
                const newDifference = Math.abs(newMaxMMR - newMinMMR);
                const totalImprovement = currentDifference - newDifference;
                
                // Solo considerar intercambios que mejoren significativamente el balance total
                if (totalImprovement > 10) { // Reducir aún más el umbral para ser muy agresivo
                    // Bonus por mejorar distribución interna
                    const tempMaxTeam = {
                        ...maxTeam,
                        players: maxTeam.players.map(p => p.name === player1.name ? player2 : p),
                        totalMMR: newMaxMMR
                    };
                    
                    const tempMinTeam = {
                        ...minTeam,
                        players: minTeam.players.map(p => p.name === player2.name ? player1 : p),
                        totalMMR: newMinMMR
                    };
                    
                    const internalImprovement = (calculateTeamBalanceScore(tempMaxTeam, targetMMR) - calculateTeamBalanceScore(maxTeam, targetMMR)) +
                                              (calculateTeamBalanceScore(tempMinTeam, targetMMR) - calculateTeamBalanceScore(minTeam, targetMMR));
                    
                    const totalScore = totalImprovement * 30 + internalImprovement * 0.1; // Aumentar aún más el peso del balance total
                    
                    if (totalScore > bestImprovement) {
                        bestImprovement = totalScore;
                        bestSwap = { player1, player2, newMaxMMR, newMinMMR };
                    }
                }
            }
        }
        
        // Realizar el mejor intercambio encontrado
        if (bestSwap && bestImprovement > 0) {
            const { player1, player2, newMaxMMR, newMinMMR } = bestSwap;
            
            // Encontrar índices de los jugadores
            const index1 = maxTeam.players.findIndex(p => p.name === player1.name);
            const index2 = minTeam.players.findIndex(p => p.name === player2.name);
            
            if (index1 !== -1 && index2 !== -1) {
                maxTeam.players[index1] = player2;
                minTeam.players[index2] = player1;
                maxTeam.totalMMR = newMaxMMR;
                minTeam.totalMMR = newMinMMR;
                
                // Actualizar roles
                maxTeam.roles.delete(player1.role);
                maxTeam.roles.add(player2.role);
                minTeam.roles.delete(player2.role);
                minTeam.roles.add(player1.role);
                
                console.log(`✅ Intercambio: ${player1.name} (${player1.role}, ${player1.mmr}) ↔ ${player2.name} (${player2.role}, ${player2.mmr}) - Mejora: ${bestImprovement.toFixed(2)}`);
            }
        } else {
            // Si no se encontró mejora, intentar intercambios más agresivos
            if (!tryAggressiveSwaps(teams, targetMMR)) {
                console.log('No se encontraron más mejoras en el balance total');
                break;
            }
        }
    }
    
    console.log(`Optimización total completada en ${iterations} iteraciones`);
}

// Función para intentar intercambios más agresivos
function tryAggressiveSwaps(teams, targetMMR) {
    // Encontrar equipos con mayor y menor MMR total
    let maxTeamIndex = 0;
    let minTeamIndex = 0;
    let maxMMR = -Infinity;
    let minMMR = Infinity;
    
    for (let i = 0; i < teams.length; i++) {
        if (teams[i].players.length === 5) {
            if (teams[i].totalMMR > maxMMR) {
                maxMMR = teams[i].totalMMR;
                maxTeamIndex = i;
            }
            if (teams[i].totalMMR < minMMR) {
                minMMR = teams[i].totalMMR;
                minTeamIndex = i;
            }
        }
    }
    
    const maxTeam = teams[maxTeamIndex];
    const minTeam = teams[minTeamIndex];
    const currentDifference = maxMMR - minMMR;
    
    // Buscar cualquier intercambio que mejore el balance, sin importar roles
    const maxPlayers = maxTeam.players.sort((a, b) => b.mmr - a.mmr);
    const minPlayers = minTeam.players.sort((a, b) => a.mmr - b.mmr);
    
    // Intentar intercambiar jugadores con mayor diferencia de MMR
    for (const highPlayer of maxPlayers) {
        for (const lowPlayer of minPlayers) {
            // Calcular mejora en balance total
            const newMaxMMR = maxTeam.totalMMR - highPlayer.mmr + lowPlayer.mmr;
            const newMinMMR = minTeam.totalMMR - lowPlayer.mmr + highPlayer.mmr;
            
            const newDifference = Math.abs(newMaxMMR - newMinMMR);
            const improvement = currentDifference - newDifference;
            
            // Solo hacer el intercambio si mejora el balance total (cualquier mejora)
            if (improvement > 1) { // Umbral extremadamente bajo para ser muy agresivo
                // Encontrar índices
                const index1 = maxTeam.players.findIndex(p => p.name === highPlayer.name);
                const index2 = minTeam.players.findIndex(p => p.name === lowPlayer.name);
                
                maxTeam.players[index1] = lowPlayer;
                minTeam.players[index2] = highPlayer;
                maxTeam.totalMMR = newMaxMMR;
                minTeam.totalMMR = newMinMMR;
                
                // Actualizar roles
                maxTeam.roles.delete(highPlayer.role);
                maxTeam.roles.add(lowPlayer.role);
                minTeam.roles.delete(lowPlayer.role);
                minTeam.roles.add(highPlayer.role);
                
                console.log(`🔥 Intercambio agresivo: ${highPlayer.name} (${highPlayer.role}, ${highPlayer.mmr}) ↔ ${lowPlayer.name} (${lowPlayer.role}, ${lowPlayer.mmr}) - Mejora: ${improvement}`);
                return true;
            }
        }
    }
    
    return false;
}

// Función para rebalancear equipos
function rebalanceTeams() {
    if (players.length < 5) {
        alert('Se necesitan al menos 5 jugadores para formar equipos');
        return;
    }
    
    console.log('🔄 Rebalanceando equipos...');
    generateTeams();
    displayTeams();
    updateStats();
    console.log('✅ Equipos rebalanceados');
}

// Función para mostrar equipos
function displayTeams() {
    const container = document.getElementById('teamsContainer');
    container.innerHTML = '';
    
    if (teams.length === 0) {
        container.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">No hay equipos generados. Agrega jugadores y genera equipos.</p>';
        return;
    }
    
    // Mostrar equipos generados
    teams.forEach((team, teamIndex) => {
        const teamDiv = document.createElement('div');
        teamDiv.className = 'team';
        
        let playersHTML = '';
        if (team.players.length === 0) {
            playersHTML = '<p style="text-align: center; opacity: 0.7;">Sin jugadores asignados</p>';
        } else {
            team.players.forEach(player => {
                const roleNames = ['', 'Hard Carry', 'Midlane', 'Offlane', 'Soft Support', 'Hard Support'];
                playersHTML += `
                    <div class="player" draggable="true">
                        <div class="player-info">
                            <div class="player-name">${player.name}</div>
                            <div class="player-id">ID: ${player.id || 'ID missing'}</div>
                            <div class="player-details">MMR: ${player.mmr} | Rol: ${roleNames[player.role]}</div>
                        </div>
                        <div class="player-actions">
                            <span class="role-badge role-${player.role}">${player.role}</span>
                            <button class="btn-edit" onclick="editPlayer(${player.index})">✏️</button>
                            <button class="btn-delete" onclick="deletePlayer(${player.index})">🗑️</button>
                        </div>
                    </div>
                `;
            });
        }
        
        teamDiv.innerHTML = `
            <h3>Equipo ${teamIndex + 1}</h3>
            ${playersHTML}
            <div class="team-stats">
                <strong>Total MMR: ${team.totalMMR}</strong><br>
                <strong>Promedio: ${Math.round(team.totalMMR / team.players.length || 0)}</strong><br>
                <strong>Jugadores: ${team.players.length}/5</strong>
            </div>
            <div class="drag-instructions">
                💡 Arrastra jugadores aquí para moverlos
            </div>
        `;
        
        container.appendChild(teamDiv);
    });
    
    // Mostrar jugadores sin asignar
    const assignedPlayers = teams.flatMap(team => team.players);
    const unassignedPlayers = players.filter(player => 
        !assignedPlayers.some(assigned => assigned.index === player.index)
    );
    
    if (unassignedPlayers.length > 0) {
        const unassignedDiv = document.createElement('div');
        unassignedDiv.className = 'team';
        unassignedDiv.style.gridColumn = '1 / -1';
        unassignedDiv.style.borderLeft = '5px solid #e74c3c';
        
        let unassignedHTML = '';
        unassignedPlayers.forEach(player => {
            const roleNames = ['', 'Hard Carry', 'Midlane', 'Offlane', 'Soft Support', 'Hard Support'];
            unassignedHTML += `
                <div class="player" draggable="true">
                    <div class="player-info">
                        <div class="player-name">${player.name}</div>
                        <div class="player-id">ID: ${player.id || 'ID missing'}</div>
                        <div class="player-details">MMR: ${player.mmr} | Rol: ${roleNames[player.role]}</div>
                    </div>
                    <div class="player-actions">
                        <span class="role-badge role-${player.role}">${player.role}</span>
                        <button class="btn-edit" onclick="editPlayer(${player.index})">✏️</button>
                        <button class="btn-delete" onclick="deletePlayer(${player.index})">🗑️</button>
                    </div>
                </div>
            `;
        });
        
        unassignedDiv.innerHTML = `
            <h3>👥 Jugadores Sin Asignar (${unassignedPlayers.length})</h3>
            <p style="text-align: center; opacity: 0.7; margin-bottom: 15px;">
                Estos jugadores no han sido asignados a ningún equipo. 
                Puedes arrastrarlos a un equipo o usar el botón "Rebalancear Equipos".
            </p>
            ${unassignedHTML}
            <div class="team-stats">
                <strong>Total MMR: ${unassignedPlayers.reduce((sum, p) => sum + p.mmr, 0)}</strong><br>
                <strong>Promedio: ${Math.round(unassignedPlayers.reduce((sum, p) => sum + p.mmr, 0) / unassignedPlayers.length || 0)}</strong><br>
                <strong>Jugadores: ${unassignedPlayers.length}</strong>
            </div>
        `;
        
        container.appendChild(unassignedDiv);
    }
    
    // Inicializar drag & drop después de crear los equipos
    setTimeout(initializeDragAndDrop, 100);
}

// Función para editar jugador
function editPlayer(playerIndex) {
    const player = players[playerIndex];
    if (!player) return;
    
    const newName = prompt('Nuevo nombre:', player.name);
    if (newName === null) return;
    
    const newId = prompt('Nuevo ID (opcional):', player.id || '');
    if (newId === null) return;
    
    const newMMR = prompt('Nuevo MMR:', player.mmr);
    if (newMMR === null) return;
    
    const newRole = prompt('Nuevo rol (1-5):', player.role);
    if (newRole === null) return;
    
    // Validar datos
    if (!newName.trim()) {
        alert('El nombre no puede estar vacío');
        return;
    }
    
    const mmr = parseInt(newMMR);
    if (isNaN(mmr) || mmr < 0) {
        alert('MMR debe ser un número válido');
        return;
    }
    
    const role = parseInt(newRole);
    if (isNaN(role) || role < 1 || role > 5) {
        alert('El rol debe ser un número entre 1 y 5');
        return;
    }
    
    // Actualizar jugador
    player.name = newName.trim();
    player.id = newId.trim() || null;
    player.mmr = mmr;
    player.role = role;
    
    // Guardar y regenerar equipos
    savePlayers();
    generateTeams();
    displayTeams();
    updateStats();
    
    console.log(`Jugador ${player.name} editado`);
}

// Función para eliminar jugador
function deletePlayer(playerIndex) {
    const player = players[playerIndex];
    if (!player) return;
    
    if (confirm(`¿Estás seguro de que quieres eliminar a ${player.name}?`)) {
        players.splice(playerIndex, 1);
        
        // Actualizar índices
        players.forEach((p, index) => {
            p.index = index;
        });
        
        // Guardar y regenerar equipos
        savePlayers();
        generateTeams();
        displayTeams();
        updateStats();
        
        console.log(`Jugador ${player.name} eliminado`);
    }
}

// Función para mostrar estadísticas
function displayStats(teams) {
    const container = document.getElementById('statsContainer');
    
    if (teams.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    const totalPlayers = players.length;
    const totalMMR = players.reduce((sum, player) => sum + player.mmr, 0);
    const avgMMR = Math.round(totalMMR / totalPlayers);
    
    const teamMMRs = teams.map(team => team.totalMMR);
    const maxTeamMMR = Math.max(...teamMMRs);
    const minTeamMMR = Math.min(...teamMMRs);
    const mmrDifference = maxTeamMMR - minTeamMMR;
    
    container.innerHTML = `
        <h3>📊 Estadísticas Generales</h3>
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-value">${teams.length}</div>
                <div class="stat-label">Equipos Formados</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${totalPlayers}</div>
                <div class="stat-label">Total Jugadores</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${avgMMR.toLocaleString()}</div>
                <div class="stat-label">MMR Promedio</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${mmrDifference.toLocaleString()}</div>
                <div class="stat-label">Diferencia MMR entre Equipos</div>
            </div>
        </div>
    `;
}

// Función para cargar datos de prueba
function loadSampleData() {
    const sampleData = [
        { name: "Arturia", id: "1113982609", mmr: 2234, role: 3 },
        { name: "Artyk-[Sebas-]", id: "199455408", mmr: 7900, role: 3 },
        { name: "NOK´CHA", id: "205124267", mmr: 3700, role: 4 },
        { name: "Logaritmo", id: "1527089650", mmr: 1420, role: 5 },
        { name: "TheKing", id: null, mmr: 8000, role: 5 },
        { name: "ashura", id: "429648767", mmr: 5300, role: 1 },
        { name: "PitAhia", id: "173453167", mmr: 4620, role: 4 },
        { name: "Potato", id: null, mmr: 6300, role: 3 },
        { name: "cheemsit", id: "1126744048", mmr: 2086, role: 5 },
        { name: "ladepepa", id: "261332428", mmr: 5700, role: 3 },
        { name: "FrAnK", id: "330014684", mmr: 6536, role: 1 },
        { name: "El Causha", id: "1204476184", mmr: 1800, role: 5 },
        { name: "Mirko", id: "451942334", mmr: 6600, role: 2 },
        { name: "drakotv", id: "1144623756", mmr: 6500, role: 3 },
        { name: "Dc", id: null, mmr: 7900, role: 2 },
        { name: "MESTICAS", id: "1507188384", mmr: 571, role: 3 },
        { name: "Abogado de KeiiKo", id: "1020273794", mmr: 2800, role: 4 },
        { name: "Piero (DIN)", id: "376381268", mmr: 3850, role: 4 },
        { name: "Benja", id: "366882489", mmr: 9200, role: 2 },
        { name: "Desux", id: "1289611343", mmr: 7344, role: 1 },
        { name: "Ladoadaniel", id: "1281633731", mmr: 3930, role: 4 },
        { name: "Jhanker", id: "186010043", mmr: 4737, role: 4 },
        { name: "Kase", id: "416279328", mmr: 4700, role: 3 },
        { name: "jaretxd", id: null, mmr: 9200, role: 1 },
        { name: "Rem Rim", id: "853552480", mmr: 3622, role: 1 },
        { name: "ANDORA", id: "461348392", mmr: 4500, role: 5 },
        { name: "tony", id: "873827986", mmr: 6400, role: 1 },
        { name: "Johanxd", id: "221813041", mmr: 4300, role: 4 },
        { name: "MARK", id: "1004566957", mmr: 8290, role: 1 },
        { name: "Jhostin", id: "1251420886", mmr: 3600, role: 1 },
        { name: "Alexander", id: "185460820", mmr: 3195, role: 5 },
        { name: "Franco", id: "201966376", mmr: 4059, role: 4 },
        { name: "turronsexo", id: "1094945424", mmr: 9600, role: 2 },
        { name: "Perdido", id: null, mmr: 8000, role: 2 },
        { name: "rod_ew", id: "106505HC", mmr: 5800, role: 1 },
        { name: "VANISHED", id: "300744466", mmr: 5900, role: 2 },
        { name: "Maxturbex", id: "85620793", mmr: 900, role: 1 },
        { name: "TUFFY", id: "873584699", mmr: 4000, role: 5 },
        { name: "RojeS", id: null, mmr: 7000, role: 1 },
        { name: "shadow", id: "1025483258", mmr: 4000, role: 4 }
    ];
    // Asignar índices a los jugadores
    players = sampleData.map((player, index) => ({
        ...player,
        index: index
    }));
    
    savePlayers();
    
    // Mostrar mensaje informativo
    const container = document.getElementById('teamsContainer');
    container.innerHTML = `
        <div style="text-align: center; grid-column: 1/-1; padding: 20px;">
            <h3 style="color: #ffd700;">✅ Datos de prueba cargados</h3>
            <p>Se han cargado ${players.length} jugadores de prueba.</p>
            <p>Haz clic en "⚡ Generar Equipos" para crear los equipos balanceados.</p>
            <button onclick="generateTeams()" class="btn-save" style="margin: 10px;">⚡ Generar Equipos</button>
        </div>
    `;
    
    updateStats();
    console.log(`${players.length} jugadores de prueba cargados`);
}

// Función para limpiar todos los datos
function clearAll() {
    if (confirm('¿Estás seguro de que quieres eliminar todos los jugadores y equipos?')) {
        players = [];
        teams = [];
        localStorage.removeItem('dota2Players');
        displayTeams();
        updateStats();
        console.log('Todos los datos han sido eliminados');
    }
}

// Cargar datos al iniciar la página
document.addEventListener('DOMContentLoaded', function() {
    loadPlayers();
    generateTeams();
    displayTeams();
    updateStats();
    
    // Permitir agregar jugador con Enter
    document.getElementById('playerName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addPlayer();
        }
    });
    
    document.getElementById('playerMMR').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addPlayer();
        }
    });
});

// Función para optimizar equipos una sola vez (mantener para compatibilidad)
function optimizeTeamsOnce(teams) {
    // Esta función ya no se usa, pero la mantengo por compatibilidad
    return;
}

// Función para mostrar/ocultar la explicación del algoritmo
function toggleAlgorithmExplanation() {
    const content = document.getElementById('algorithm-content');
    const toggle = document.getElementById('algorithm-toggle');
    
    if (content.classList.contains('show')) {
        content.classList.remove('show');
        toggle.textContent = '▼';
    } else {
        content.classList.add('show');
        toggle.textContent = '▲';
    }
}

// Variables para drag & drop
let draggedPlayer = null;
let draggedPlayerElement = null;

// Función para inicializar drag & drop
function initializeDragAndDrop() {
    const players = document.querySelectorAll('.player');
    const teams = document.querySelectorAll('.team');
    
    players.forEach(player => {
        player.setAttribute('draggable', true);
        player.addEventListener('dragstart', handleDragStart);
        player.addEventListener('dragend', handleDragEnd);
    });
    
    teams.forEach(team => {
        team.addEventListener('dragover', handleDragOver);
        team.addEventListener('dragenter', handleDragEnter);
        team.addEventListener('dragleave', handleDragLeave);
        team.addEventListener('drop', handleDrop);
    });
}

// Event handlers para drag & drop
function handleDragStart(e) {
    draggedPlayer = e.target;
    draggedPlayerElement = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedPlayer = null;
    draggedPlayerElement = null;
    
    // Remover clases de drag-over de todos los equipos
    document.querySelectorAll('.team').forEach(team => {
        team.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    if (!draggedPlayer) return;
    
    const sourceTeam = draggedPlayer.closest('.team');
    const targetTeam = e.currentTarget;
    
    if (sourceTeam === targetTeam) return;
    
    // Obtener datos del jugador arrastrado
    const playerName = draggedPlayer.querySelector('.player-name').textContent;
    const playerId = draggedPlayer.querySelector('.player-id').textContent.replace('ID: ', '');
    const playerMMR = parseInt(draggedPlayer.querySelector('.player-details').textContent.match(/MMR: (\d+)/)[1]);
    const playerRole = parseInt(draggedPlayer.querySelector('.role-badge').textContent.match(/(\d+)/)[1]);
    
    // Encontrar el jugador en el array de datos
    const playerIndex = players.findIndex(p => 
        p.name === playerName && 
        p.mmr === playerMMR && 
        p.role === playerRole
    );
    
    if (playerIndex === -1) return;
    
    // Obtener índices de equipos
    const allTeams = Array.from(document.querySelectorAll('.team'));
    const sourceTeamIndex = allTeams.indexOf(sourceTeam);
    const targetTeamIndex = allTeams.indexOf(targetTeam);
    
    // Verificar si el equipo destino está lleno
    const targetTeamPlayers = targetTeam.querySelectorAll('.player');
    
    if (targetTeamPlayers.length >= 5) {
        alert('El equipo destino está lleno. No se puede mover el jugador.');
        return;
    }
    
    // Determinar si el origen es un equipo o la sección de sin asignar
    const isFromUnassigned = sourceTeam.querySelector('h3')?.textContent.includes('Sin Asignar');
    
    if (isFromUnassigned) {
        // Jugador viene de la sección sin asignar
        const movedPlayer = players[playerIndex];
        
        // Agregar jugador al equipo destino en los datos
        const targetTeamData = teams[targetTeamIndex];
        targetTeamData.players.push(movedPlayer);
        targetTeamData.totalMMR += movedPlayer.mmr;
        targetTeamData.roles.add(movedPlayer.role);
        
        // Remover elemento visual del origen
        draggedPlayer.remove();
        
        // Crear nuevo elemento visual en el equipo destino
        const newPlayerElement = createPlayerElement(movedPlayer);
        targetTeam.appendChild(newPlayerElement);
        
        // Reinicializar drag & drop para el nuevo elemento
        newPlayerElement.setAttribute('draggable', true);
        newPlayerElement.addEventListener('dragstart', handleDragStart);
        newPlayerElement.addEventListener('dragend', handleDragEnd);
        
        console.log(`Jugador ${playerName} asignado desde sin asignar al equipo ${targetTeamIndex + 1}`);
    } else {
        // Jugador viene de otro equipo
        const sourceTeamData = teams[sourceTeamIndex];
        const playerInSourceTeam = sourceTeamData.players.findIndex(p => 
            p.name === playerName && 
            p.mmr === playerMMR && 
            p.role === playerRole
        );
        
        if (playerInSourceTeam !== -1) {
            const movedPlayer = sourceTeamData.players.splice(playerInSourceTeam, 1)[0];
            sourceTeamData.totalMMR -= movedPlayer.mmr;
            sourceTeamData.roles.delete(movedPlayer.role);
            
            // Agregar jugador al equipo destino en los datos
            const targetTeamData = teams[targetTeamIndex];
            targetTeamData.players.push(movedPlayer);
            targetTeamData.totalMMR += movedPlayer.mmr;
            targetTeamData.roles.add(movedPlayer.role);
            
            // Remover elemento visual del equipo origen
            draggedPlayer.remove();
            
            // Crear nuevo elemento visual en el equipo destino
            const newPlayerElement = createPlayerElement(movedPlayer);
            targetTeam.appendChild(newPlayerElement);
            
            // Reinicializar drag & drop para el nuevo elemento
            newPlayerElement.setAttribute('draggable', true);
            newPlayerElement.addEventListener('dragstart', handleDragStart);
            newPlayerElement.addEventListener('dragend', handleDragEnd);
            
            console.log(`Jugador ${playerName} movido del equipo ${sourceTeamIndex + 1} al equipo ${targetTeamIndex + 1}`);
        }
    }
    
    // Actualizar estadísticas y mostrar jugadores sin asignar
    updateStats();
    displayTeams();
    
    // Guardar cambios
    savePlayers();
}

// Función para crear elemento de jugador (reutilizada)
function createPlayerElement(player) {
    const playerDiv = document.createElement('div');
    playerDiv.className = 'player';
    playerDiv.setAttribute('draggable', true);
    
    const roleNames = ['', 'Hard Carry', 'Midlane', 'Offlane', 'Soft Support', 'Hard Support'];
    
    playerDiv.innerHTML = `
        <div class="player-info">
            <div class="player-name">${player.name}</div>
            <div class="player-id">ID: ${player.id || 'ID missing'}</div>
            <div class="player-details">MMR: ${player.mmr} | Rol: ${roleNames[player.role]}</div>
        </div>
        <div class="player-actions">
            <span class="role-badge role-${player.role}">${player.role}</span>
            <button class="btn-edit" onclick="editPlayer(${player.index})">✏️</button>
            <button class="btn-delete" onclick="deletePlayer(${player.index})">🗑️</button>
        </div>
    `;
    
    return playerDiv;
}

// Función para actualizar estadísticas
function updateStats() {
    const statsContainer = document.getElementById('statsContainer');
    
    if (teams.length === 0) {
        statsContainer.innerHTML = '';
        return;
    }
    
    const totalMMR = teams.reduce((sum, team) => sum + team.totalMMR, 0);
    const avgMMR = totalMMR / teams.length;
    const mmrDifferences = teams.map(team => Math.abs(team.totalMMR - avgMMR));
    const maxDifference = Math.max(...mmrDifferences);
    const minDifference = Math.min(...mmrDifferences);
    
    // Calcular diferencia entre el equipo con mayor y menor MMR total
    const teamMMRs = teams.map(team => team.totalMMR);
    const maxTeamMMR = Math.max(...teamMMRs);
    const minTeamMMR = Math.min(...teamMMRs);
    const totalMMRDifference = maxTeamMMR - minTeamMMR;
    
    const teamStats = teams.map((team, index) => ({
        team: index + 1,
        totalMMR: team.totalMMR,
        averageMMR: team.players.length > 0 ? team.totalMMR / team.players.length : 0,
        players: team.players.length,
        difference: Math.abs(team.totalMMR - avgMMR)
    }));
    
    // Ordenar equipos por total MMR para mostrar mejor la distribución
    teamStats.sort((a, b) => b.totalMMR - a.totalMMR);
    
    statsContainer.innerHTML = `
        <div class="stats">
            <h3>📊 Estadísticas de Equipos</h3>
            
            <!-- PRIORIDAD: Diferencia del Total MMR entre equipos -->
            <div style="background: rgba(255, 215, 0, 0.2); border: 2px solid #ffd700; border-radius: 10px; padding: 15px; margin-bottom: 20px;">
                <h4 style="color: #ffd700; margin: 0 0 10px 0; text-align: center;">🎯 PRIORIDAD: Balance del Total MMR</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; text-align: center;">
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: #ffd700;">${totalMMRDifference}</div>
                        <div style="font-size: 14px;">Diferencia Total MMR</div>
                        <div style="font-size: 12px; opacity: 0.8;">(Mayor - Menor)</div>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: #2ecc71;">${Math.round(totalMMRDifference / avgMMR * 100)}%</div>
                        <div style="font-size: 14px;">Porcentaje de Diferencia</div>
                        <div style="font-size: 12px; opacity: 0.8;">(vs Promedio Global)</div>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: #e74c3c;">${maxTeamMMR}</div>
                        <div style="font-size: 14px;">Mayor Total MMR</div>
                        <div style="font-size: 12px; opacity: 0.8;">(Equipo más fuerte)</div>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: #3498db;">${minTeamMMR}</div>
                        <div style="font-size: 14px;">Menor Total MMR</div>
                        <div style="font-size: 12px; opacity: 0.8;">(Equipo más débil)</div>
                    </div>
                </div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value">${teams.length}</div>
                    <div class="stat-label">Equipos Generados</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${Math.round(avgMMR)}</div>
                    <div class="stat-label">MMR Promedio Global</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${maxDifference}</div>
                    <div class="stat-label">Mayor Desviación</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${minDifference}</div>
                    <div class="stat-label">Menor Desviación</div>
                </div>
            </div>
            
            <h4 style="margin-top: 20px; color: #ffd700;">Detalles por Equipo (Ordenados por Total MMR):</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 15px;">
                ${teamStats.map((stat, index) => `
                    <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid ${index === 0 ? '#e74c3c' : index === teamStats.length - 1 ? '#3498db' : '#2ecc71'};">
                        <div style="font-size: 18px; font-weight: bold; color: #ffd700;">Equipo ${stat.team}</div>
                        <div style="margin-top: 10px;">
                            <div style="font-size: 16px; font-weight: bold; color: ${index === 0 ? '#e74c3c' : index === teamStats.length - 1 ? '#3498db' : '#2ecc71'};">
                                Total MMR: <strong>${stat.totalMMR}</strong>
                            </div>
                            <div>Promedio: <strong>${Math.round(stat.averageMMR)}</strong></div>
                            <div>Jugadores: <strong>${stat.players}/5</strong></div>
                            <div>Desviación: <strong>${stat.difference}</strong></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Función para guardar jugadores en localStorage
function savePlayers() {
    localStorage.setItem('dota2Players', JSON.stringify(players));
    console.log('Jugadores guardados en localStorage');
}

// Función para cargar jugadores desde localStorage
function loadPlayers() {
    let loaded = [];
    try {
        loaded = JSON.parse(localStorage.getItem('players')) || [];
    } catch (e) {
        loaded = [];
    }
    // Limpiar y validar cada jugador
    players = loaded.filter(p => {
        // Limpiar espacios
        if (typeof p.id === 'string') p.id = p.id.trim();
        if (typeof p.name === 'string') p.name = p.name.trim();
        if (typeof p.role === 'string' || typeof p.role === 'number') p.role = parseInt(String(p.role).trim());
        if (typeof p.mmr === 'string' || typeof p.mmr === 'number') p.mmr = parseInt(String(p.mmr).trim());

        // Validar datos: id numérico, nombre no vacío, mmr y rol válidos
        if (!p.id || isNaN(Number(p.id)) || !p.name || isNaN(p.mmr) || isNaN(p.role)) return false;
        return true;
    });
}

// Función para verificar y asegurar que todos los equipos tengan exactamente 5 jugadores
function enforceExactTeamSize(teams) {
    let hasChanges = true;
    let maxIterations = 10;
    
    while (hasChanges && maxIterations-- > 0) {
        hasChanges = false;
        
        // Encontrar equipos con más de 5 jugadores
        const oversizedTeams = teams.filter(team => team.players.length > 5);
        const undersizedTeams = teams.filter(team => team.players.length < 5);
        
        if (oversizedTeams.length === 0) {
            console.log('✅ Todos los equipos tienen 5 o menos jugadores');
            break;
        }
        
        console.log(`⚠️ Encontrados ${oversizedTeams.length} equipos con más de 5 jugadores`);
        
        for (const oversizedTeam of oversizedTeams) {
            if (oversizedTeam.players.length <= 5) continue;
            
            // Remover jugadores excedentes y ponerlos en equipos con espacio
            const excessPlayers = oversizedTeam.players.slice(5);
            oversizedTeam.players = oversizedTeam.players.slice(0, 5);
            
            // Recalcular MMR y roles del equipo oversized
            oversizedTeam.totalMMR = oversizedTeam.players.reduce((sum, p) => sum + p.mmr, 0);
            oversizedTeam.roles.clear();
            oversizedTeam.players.forEach(p => oversizedTeam.roles.add(p.role));
            
            console.log(`📤 Removidos ${excessPlayers.length} jugadores del equipo oversized:`, excessPlayers.map(p => p.name));
            
            // Asignar jugadores excedentes a equipos con espacio
            for (const player of excessPlayers) {
                let assigned = false;
                
                // Buscar equipo con menos de 5 jugadores
                for (const team of undersizedTeams) {
                    if (team.players.length < 5) {
                        team.players.push(player);
                        team.totalMMR += player.mmr;
                        team.roles.add(player.role);
                        assigned = true;
                        console.log(`✅ Jugador ${player.name} reasignado a equipo con ${team.players.length} jugadores`);
                        break;
                    }
                }
                
                if (!assigned) {
                    console.log(`❌ No se pudo reasignar ${player.name} - no hay equipos con espacio`);
                }
            }
            
            hasChanges = true;
        }
    }
    
    if (maxIterations <= 0) {
        console.log('⚠️ Se alcanzó el límite de iteraciones en enforceExactTeamSize');
    }
}

// Función para optimización final muy agresiva
function finalAggressiveOptimization(teams, targetMMR) {
    console.log('🚀 Iniciando optimización final muy agresiva...');
    
    let iterations = 0;
    const maxIterations = 300; // Aumentar significativamente las iteraciones
    
    while (iterations < maxIterations) {
        iterations++;
        
        // Encontrar equipos con mayor y menor MMR total
        let maxTeamIndex = 0;
        let minTeamIndex = 0;
        let maxMMR = -Infinity;
        let minMMR = Infinity;
        
        for (let i = 0; i < teams.length; i++) {
            if (teams[i].players.length === 5) {
                if (teams[i].totalMMR > maxMMR) {
                    maxMMR = teams[i].totalMMR;
                    maxTeamIndex = i;
                }
                if (teams[i].totalMMR < minMMR) {
                    minMMR = teams[i].totalMMR;
                    minTeamIndex = i;
                }
            }
        }
        
        const currentDifference = maxMMR - minMMR;
        console.log(`🔥 Iteración ${iterations}: Diferencia = ${currentDifference} (${maxMMR} - ${minMMR})`);
        
        // Si la diferencia es muy pequeña, terminar
        if (currentDifference < 20) {
            console.log('✅ Diferencia muy pequeña (< 20), optimización final completada');
            break;
        }
        
        const maxTeam = teams[maxTeamIndex];
        const minTeam = teams[minTeamIndex];
        
        // Buscar cualquier intercambio que mejore el balance
        let bestSwap = null;
        let bestImprovement = 0;
        
        for (const highPlayer of maxTeam.players) {
            for (const lowPlayer of minTeam.players) {
                // Calcular mejora en balance total
                const newMaxMMR = maxTeam.totalMMR - highPlayer.mmr + lowPlayer.mmr;
                const newMinMMR = minTeam.totalMMR - lowPlayer.mmr + highPlayer.mmr;
                
                const newDifference = Math.abs(newMaxMMR - newMinMMR);
                const improvement = currentDifference - newDifference;
                
                // Solo hacer el intercambio si mejora el balance total (cualquier mejora)
                if (improvement > 0) { // Cualquier mejora, por pequeña que sea
                    if (improvement > bestImprovement) {
                        bestImprovement = improvement;
                        bestSwap = { highPlayer, lowPlayer, newMaxMMR, newMinMMR };
                    }
                }
            }
        }
        
        if (bestSwap) {
            const { highPlayer, lowPlayer, newMaxMMR, newMinMMR } = bestSwap;
            
            // Encontrar índices
            const index1 = maxTeam.players.findIndex(p => p.name === highPlayer.name);
            const index2 = minTeam.players.findIndex(p => p.name === lowPlayer.name);
            
            maxTeam.players[index1] = lowPlayer;
            minTeam.players[index2] = highPlayer;
            maxTeam.totalMMR = newMaxMMR;
            minTeam.totalMMR = newMinMMR;
            
            // Actualizar roles
            maxTeam.roles.delete(highPlayer.role);
            maxTeam.roles.add(lowPlayer.role);
            minTeam.roles.delete(lowPlayer.role);
            minTeam.roles.add(highPlayer.role);
            
            console.log(`🔥 Intercambio final: ${highPlayer.name} (${highPlayer.mmr}) ↔ ${lowPlayer.name} (${lowPlayer.mmr}) - Mejora: ${bestImprovement}`);
        } else {
            console.log('❌ No se encontraron más mejoras en la optimización final');
            break;
        }
    }
    
    console.log(`🚀 Optimización final completada en ${iterations} iteraciones`);
}

// Función para optimización global entre todos los equipos
function globalTeamOptimization(teams, targetMMR) {
    console.log('🌍 Iniciando optimización global entre todos los equipos...');
    
    let iterations = 0;
    const maxIterations = 200;
    
    while (iterations < maxIterations) {
        iterations++;
        
        // Calcular diferencia actual entre el equipo más fuerte y más débil
        let maxMMR = -Infinity;
        let minMMR = Infinity;
        
        for (const team of teams) {
            if (team.players.length === 5) {
                if (team.totalMMR > maxMMR) maxMMR = team.totalMMR;
                if (team.totalMMR < minMMR) minMMR = team.totalMMR;
            }
        }
        
        const currentDifference = maxMMR - minMMR;
        console.log(`🌍 Iteración ${iterations}: Diferencia global = ${currentDifference}`);
        
        if (currentDifference < 30) {
            console.log('✅ Diferencia global muy pequeña (< 30), optimización global completada');
            break;
        }
        
        // Buscar el mejor intercambio entre cualquier par de equipos
        let bestSwap = null;
        let bestImprovement = 0;
        
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                const team1 = teams[i];
                const team2 = teams[j];
                
                if (team1.players.length !== 5 || team2.players.length !== 5) continue;
                
                // Probar intercambios entre todos los jugadores de ambos equipos
                for (const player1 of team1.players) {
                    for (const player2 of team2.players) {
                        // Calcular MMR después del intercambio
                        const newTeam1MMR = team1.totalMMR - player1.mmr + player2.mmr;
                        const newTeam2MMR = team2.totalMMR - player2.mmr + player1.mmr;
                        
                        // Calcular nueva diferencia global
                        let newMaxMMR = maxMMR;
                        let newMinMMR = minMMR;
                        
                        if (team1.totalMMR === maxMMR) {
                            newMaxMMR = Math.max(newTeam1MMR, newTeam2MMR, ...teams.filter(t => t !== team1 && t !== team2).map(t => t.totalMMR));
                        } else if (team2.totalMMR === maxMMR) {
                            newMaxMMR = Math.max(newTeam1MMR, newTeam2MMR, ...teams.filter(t => t !== team1 && t !== team2).map(t => t.totalMMR));
                        }
                        
                        if (team1.totalMMR === minMMR) {
                            newMinMMR = Math.min(newTeam1MMR, newTeam2MMR, ...teams.filter(t => t !== team1 && t !== team2).map(t => t.totalMMR));
                        } else if (team2.totalMMR === minMMR) {
                            newMinMMR = Math.min(newTeam1MMR, newTeam2MMR, ...teams.filter(t => t !== team1 && t !== team2).map(t => t.totalMMR));
                        }
                        
                        const newDifference = newMaxMMR - newMinMMR;
                        const improvement = currentDifference - newDifference;
                        
                        // Solo considerar mejoras
                        if (improvement > 0) {
                            if (improvement > bestImprovement) {
                                bestImprovement = improvement;
                                bestSwap = { team1, team2, player1, player2, newTeam1MMR, newTeam2MMR };
                            }
                        }
                    }
                }
            }
        }
        
        if (bestSwap) {
            const { team1, team2, player1, player2, newTeam1MMR, newTeam2MMR } = bestSwap;
            
            // Realizar el intercambio
            const index1 = team1.players.findIndex(p => p.name === player1.name);
            const index2 = team2.players.findIndex(p => p.name === player2.name);
            
            team1.players[index1] = player2;
            team2.players[index2] = player1;
            team1.totalMMR = newTeam1MMR;
            team2.totalMMR = newTeam2MMR;
            
            // Actualizar roles
            team1.roles.delete(player1.role);
            team1.roles.add(player2.role);
            team2.roles.delete(player2.role);
            team2.roles.add(player1.role);
            
            console.log(`🌍 Intercambio global: ${player1.name} (${player1.mmr}) ↔ ${player2.name} (${player2.mmr}) - Mejora: ${bestImprovement}`);
        } else {
            console.log('❌ No se encontraron más mejoras en la optimización global');
            break;
        }
    }
    
    console.log(`🌍 Optimización global completada en ${iterations} iteraciones`);
}

// Función para optimización matemática avanzada con programación dinámica
function advancedMathematicalOptimization(teams, targetMMR) {
    console.log('🧮 Iniciando optimización matemática avanzada...');
    
    let iterations = 0;
    const maxIterations = 1000; // Muchas iteraciones para ser muy persistente
    
    while (iterations < maxIterations) {
        iterations++;
        
        // Calcular métricas actuales
        const currentMetrics = calculateTeamMetrics(teams);
        console.log(`🧮 Iteración ${iterations}: Diferencia total = ${currentMetrics.totalDifference}, Desviación promedio = ${currentMetrics.avgDeviation.toFixed(2)}`);
        
        // Si ya está muy balanceado, terminar
        if (currentMetrics.totalDifference < 100 && currentMetrics.avgDeviation < 500) {
            console.log('✅ Equipos muy balanceados, optimización matemática completada');
            break;
        }
        
        // Encontrar el mejor intercambio usando programación dinámica
        const bestSwap = findOptimalSwap(teams, currentMetrics);
        
        if (bestSwap && bestSwap.improvement > 0) {
            // Realizar el intercambio
            performSwap(teams, bestSwap);
            console.log(`🧮 Intercambio óptimo: ${bestSwap.player1.name} (${bestSwap.player1.mmr}) ↔ ${bestSwap.player2.name} (${bestSwap.player2.mmr}) - Mejora: ${bestSwap.improvement.toFixed(2)}`);
        } else {
            console.log('❌ No se encontraron más mejoras en la optimización matemática');
            break;
        }
    }
    
    console.log(`🧮 Optimización matemática completada en ${iterations} iteraciones`);
}

// Función para calcular métricas de todos los equipos
function calculateTeamMetrics(teams) {
    const teamMMRs = teams.map(team => team.totalMMR);
    const teamAverages = teams.map(team => team.players.length > 0 ? team.totalMMR / team.players.length : 0);
    
    const maxMMR = Math.max(...teamMMRs);
    const minMMR = Math.min(...teamMMRs);
    const totalDifference = maxMMR - minMMR;
    
    const avgMMR = teamMMRs.reduce((sum, mmr) => sum + mmr, 0) / teamMMRs.length;
    const avgDeviation = teamMMRs.reduce((sum, mmr) => sum + Math.abs(mmr - avgMMR), 0) / teamMMRs.length;
    
    const maxAvg = Math.max(...teamAverages);
    const minAvg = Math.min(...teamAverages);
    const avgDifference = maxAvg - minAvg;
    
    return {
        totalDifference,
        avgDifference,
        avgDeviation,
        maxMMR,
        minMMR,
        maxAvg,
        minAvg,
        teamMMRs,
        teamAverages
    };
}

// Función para encontrar el intercambio óptimo usando programación dinámica
function findOptimalSwap(teams, currentMetrics) {
    let bestSwap = null;
    let bestScore = -Infinity;
    
    // Probar todos los pares de equipos
    for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
            const team1 = teams[i];
            const team2 = teams[j];
            
            if (team1.players.length !== 5 || team2.players.length !== 5) continue;
            
            // Probar todos los pares de jugadores
            for (const player1 of team1.players) {
                for (const player2 of team2.players) {
                    // Simular el intercambio
                    const newTeam1MMR = team1.totalMMR - player1.mmr + player2.mmr;
                    const newTeam2MMR = team2.totalMMR - player2.mmr + player1.mmr;
                    const newTeam1Avg = newTeam1MMR / 5;
                    const newTeam2Avg = newTeam2MMR / 5;
                    
                    // Calcular nuevas métricas
                    const newTeamMMRs = [...currentMetrics.teamMMRs];
                    const newTeamAverages = [...currentMetrics.teamAverages];
                    newTeamMMRs[i] = newTeam1MMR;
                    newTeamMMRs[j] = newTeam2MMR;
                    newTeamAverages[i] = newTeam1Avg;
                    newTeamAverages[j] = newTeam2Avg;
                    
                    const newMaxMMR = Math.max(...newTeamMMRs);
                    const newMinMMR = Math.min(...newTeamMMRs);
                    const newTotalDifference = newMaxMMR - newMinMMR;
                    
                    const newAvgMMR = newTeamMMRs.reduce((sum, mmr) => sum + mmr, 0) / newTeamMMRs.length;
                    const newAvgDeviation = newTeamMMRs.reduce((sum, mmr) => sum + Math.abs(mmr - newAvgMMR), 0) / newTeamMMRs.length;
                    
                    const newMaxAvg = Math.max(...newTeamAverages);
                    const newMinAvg = Math.min(...newTeamAverages);
                    const newAvgDifference = newMaxAvg - newMinAvg;
                    
                    // Calcular score de mejora (función multi-objetivo)
                    const totalImprovement = currentMetrics.totalDifference - newTotalDifference;
                    const avgImprovement = currentMetrics.avgDifference - newAvgDifference;
                    const deviationImprovement = currentMetrics.avgDeviation - newAvgDeviation;
                    
                    // Score ponderado que considera múltiples objetivos
                    const score = totalImprovement * 2.0 + // Prioridad alta al total MMR
                                 avgImprovement * 1.5 +    // Prioridad media al promedio
                                 deviationImprovement * 1.0; // Prioridad baja a la desviación
                    
                    // Solo considerar mejoras significativas
                    if (score > 0 && score > bestScore) {
                        bestScore = score;
                        bestSwap = {
                            team1: team1,
                            team2: team2,
                            player1: player1,
                            player2: player2,
                            newTeam1MMR: newTeam1MMR,
                            newTeam2MMR: newTeam2MMR,
                            improvement: score,
                            totalImprovement: totalImprovement,
                            avgImprovement: avgImprovement,
                            deviationImprovement: deviationImprovement
                        };
                    }
                }
            }
        }
    }
    
    return bestSwap;
}

// Función para realizar un intercambio
function performSwap(teams, swap) {
    const { team1, team2, player1, player2, newTeam1MMR, newTeam2MMR } = swap;
    
    // Encontrar índices de los jugadores
    const index1 = team1.players.findIndex(p => p.name === player1.name);
    const index2 = team2.players.findIndex(p => p.name === player2.name);
    
    // Realizar el intercambio
    team1.players[index1] = player2;
    team2.players[index2] = player1;
    team1.totalMMR = newTeam1MMR;
    team2.totalMMR = newTeam2MMR;
    
    // Actualizar roles
    team1.roles.delete(player1.role);
    team1.roles.add(player2.role);
    team2.roles.delete(player2.role);
    team2.roles.add(player1.role);
}

// Algoritmo de Simulated Annealing para optimización final
function simulatedAnnealingOptimization(teams, targetMMR) {
    console.log('❄️ Iniciando optimización con Simulated Annealing...');
    
    // Parámetros del algoritmo
    const initialTemperature = 1000;
    const coolingRate = 0.95;
    const minTemperature = 0.1;
    const iterationsPerTemperature = 50;
    
    let temperature = initialTemperature;
    let currentMetrics = calculateTeamMetrics(teams);
    let bestMetrics = { ...currentMetrics };
    let bestTeams = deepCopyTeams(teams);
    
    let totalIterations = 0;
    const maxTotalIterations = 2000;
    
    while (temperature > minTemperature && totalIterations < maxTotalIterations) {
        for (let i = 0; i < iterationsPerTemperature; i++) {
            totalIterations++;
            
            // Generar un intercambio aleatorio
            const randomSwap = generateRandomSwap(teams);
            if (!randomSwap) continue;
            
            // Simular el intercambio
            const newTeams = simulateSwap(teams, randomSwap);
            const newMetrics = calculateTeamMetrics(newTeams);
            
            // Calcular la diferencia de energía (score)
            const currentScore = calculateOptimizationScore(currentMetrics);
            const newScore = calculateOptimizationScore(newMetrics);
            const deltaE = newScore - currentScore;
            
            // Criterio de aceptación
            if (deltaE > 0 || Math.random() < Math.exp(deltaE / temperature)) {
                // Aceptar el intercambio
                performSwap(teams, randomSwap);
                currentMetrics = newMetrics;
                
                // Actualizar el mejor resultado encontrado
                if (newScore > calculateOptimizationScore(bestMetrics)) {
                    bestMetrics = { ...newMetrics };
                    bestTeams = deepCopyTeams(teams);
                    console.log(`❄️ Nuevo mejor resultado: Diferencia total = ${bestMetrics.totalDifference}, Score = ${newScore.toFixed(2)}`);
                }
            }
        }
        
        // Enfriar el sistema
        temperature *= coolingRate;
        
        if (totalIterations % 500 === 0) {
            console.log(`❄️ Iteración ${totalIterations}: Temperatura = ${temperature.toFixed(2)}, Diferencia actual = ${currentMetrics.totalDifference}`);
        }
    }
    
    // Restaurar el mejor resultado encontrado
    if (calculateOptimizationScore(bestMetrics) > calculateOptimizationScore(calculateTeamMetrics(teams))) {
        // Copiar el mejor resultado de vuelta a teams
        for (let i = 0; i < teams.length; i++) {
            teams[i].players = [...bestTeams[i].players];
            teams[i].totalMMR = bestTeams[i].totalMMR;
            teams[i].roles = new Set(Array.from(bestTeams[i].roles));
        }
        console.log('❄️ Restaurando el mejor resultado encontrado');
    }
    
    console.log(`❄️ Simulated Annealing completado en ${totalIterations} iteraciones`);
}

// Función para generar un intercambio aleatorio
function generateRandomSwap(teams) {
    const validTeams = teams.filter(team => team.players.length === 5);
    if (validTeams.length < 2) return null;
    
    const team1 = validTeams[Math.floor(Math.random() * validTeams.length)];
    const team2 = validTeams[Math.floor(Math.random() * validTeams.length)];
    
    if (team1 === team2) return null;
    
    const player1 = team1.players[Math.floor(Math.random() * team1.players.length)];
    const player2 = team2.players[Math.floor(Math.random() * team2.players.length)];
    
    return {
        team1: team1,
        team2: team2,
        player1: player1,
        player2: player2,
        newTeam1MMR: team1.totalMMR - player1.mmr + player2.mmr,
        newTeam2MMR: team2.totalMMR - player2.mmr + player1.mmr
    };
}

// Función para simular un intercambio sin realizarlo
function simulateSwap(teams, swap) {
    const newTeams = deepCopyTeams(teams);
    const team1Index = newTeams.findIndex(t => t.totalMMR === swap.team1.totalMMR && t.players.length === swap.team1.players.length);
    const team2Index = newTeams.findIndex(t => t.totalMMR === swap.team2.totalMMR && t.players.length === swap.team2.players.length);
    
    if (team1Index === -1 || team2Index === -1) return teams;
    
    newTeams[team1Index].totalMMR = swap.newTeam1MMR;
    newTeams[team2Index].totalMMR = swap.newTeam2MMR;
    
    return newTeams;
}

// Función para calcular el score de optimización
function calculateOptimizationScore(metrics) {
    // Score inverso (menor es mejor)
    const totalScore = 10000 - metrics.totalDifference * 2;
    const avgScore = 5000 - metrics.avgDifference * 10;
    const deviationScore = 2000 - metrics.avgDeviation * 0.5;
    
    return totalScore + avgScore + deviationScore;
}

// Función para hacer deep copy de equipos
function deepCopyTeams(teams) {
    return teams.map(team => ({
        players: [...team.players],
        totalMMR: team.totalMMR,
        roles: new Set(Array.from(team.roles))
    }));
}

// Función principal de optimización con múltiples estrategias
function optimizeTeams(teams, targetMMR) {
    console.log("🚀 Iniciando optimización agresiva con múltiples estrategias...");
    
    let bestTeams = deepCopyTeams(teams);
    let bestScore = calculateTotalBalanceScore(bestTeams, targetMMR);
    let iterations = 0;
    const maxIterations = 2000; // Aumentar significativamente las iteraciones
    let noImprovementCount = 0;
    const maxNoImprovement = 500; // Más persistencia
    
    console.log(`📊 Score inicial: ${bestScore.toFixed(2)}`);
    
    // Estrategia 1: Optimización agresiva con intercambios múltiples
    console.log("🔄 Estrategia 1: Optimización agresiva con intercambios múltiples");
    for (let i = 0; i < maxIterations && noImprovementCount < maxNoImprovement; i++) {
        iterations++;
        
        // Intercambios entre múltiples equipos (no solo 2)
        const numTeams = teams.length;
        const team1 = Math.floor(Math.random() * numTeams);
        const team2 = Math.floor(Math.random() * numTeams);
        const team3 = Math.floor(Math.random() * numTeams);
        
        if (team1 !== team2 && team2 !== team3 && team1 !== team3) {
            const currentTeams = deepCopyTeams(bestTeams);
            
            // Intercambio triple
            if (currentTeams[team1].players.length > 0 && 
                currentTeams[team2].players.length > 0 && 
                currentTeams[team3].players.length > 0) {
                
                const player1 = currentTeams[team1].players[Math.floor(Math.random() * currentTeams[team1].players.length)];
                const player2 = currentTeams[team2].players[Math.floor(Math.random() * currentTeams[team2].players.length)];
                const player3 = currentTeams[team3].players[Math.floor(Math.random() * currentTeams[team3].players.length)];
                
                // Rotación triple
                removePlayerFromTeam(currentTeams[team1], player1);
                removePlayerFromTeam(currentTeams[team2], player2);
                removePlayerFromTeam(currentTeams[team3], player3);
                
                addPlayerToTeam(currentTeams[team2], player1);
                addPlayerToTeam(currentTeams[team3], player2);
                addPlayerToTeam(currentTeams[team1], player3);
                
                updateTeamStats(currentTeams[team1]);
                updateTeamStats(currentTeams[team2]);
                updateTeamStats(currentTeams[team3]);
                
                const newScore = calculateTotalBalanceScore(currentTeams, targetMMR);
                
                if (newScore > bestScore) {
                    bestScore = newScore;
                    bestTeams = deepCopyTeams(currentTeams);
                    noImprovementCount = 0;
                    console.log(`✅ Mejora encontrada en iteración ${i}: ${newScore.toFixed(2)}`);
                } else {
                    noImprovementCount++;
                }
            }
        }
        
        // Intercambios simples más agresivos
        if (i % 10 === 0) {
            const currentTeams = deepCopyTeams(bestTeams);
            const team1 = Math.floor(Math.random() * numTeams);
            const team2 = Math.floor(Math.random() * numTeams);
            
            if (team1 !== team2 && 
                currentTeams[team1].players.length > 0 && 
                currentTeams[team2].players.length > 0) {
                
                const player1 = currentTeams[team1].players[Math.floor(Math.random() * currentTeams[team1].players.length)];
                const player2 = currentTeams[team2].players[Math.floor(Math.random() * currentTeams[team2].players.length)];
                
                // Intercambio directo
                removePlayerFromTeam(currentTeams[team1], player1);
                removePlayerFromTeam(currentTeams[team2], player2);
                
                addPlayerToTeam(currentTeams[team1], player2);
                addPlayerToTeam(currentTeams[team2], player1);
                
                updateTeamStats(currentTeams[team1]);
                updateTeamStats(currentTeams[team2]);
                
                const newScore = calculateTotalBalanceScore(currentTeams, targetMMR);
                
                if (newScore > bestScore) {
                    bestScore = newScore;
                    bestTeams = deepCopyTeams(currentTeams);
                    noImprovementCount = 0;
                    console.log(`✅ Mejora encontrada en iteración ${i}: ${newScore.toFixed(2)}`);
                }
            }
        }
    }
    
    console.log(`📊 Después de Estrategia 1: ${bestScore.toFixed(2)} (${iterations} iteraciones)`);
    
    // Estrategia 2: Simulated Annealing más agresivo
    console.log("🔥 Estrategia 2: Simulated Annealing agresivo");
    let temperature = 1000;
    const coolingRate = 0.95;
    const minTemperature = 0.1;
    
    for (let i = 0; i < 1000 && temperature > minTemperature; i++) {
        const currentTeams = deepCopyTeams(bestTeams);
        const team1 = Math.floor(Math.random() * teams.length);
        const team2 = Math.floor(Math.random() * teams.length);
        
        if (team1 !== team2 && 
            currentTeams[team1].players.length > 0 && 
            currentTeams[team2].players.length > 0) {
            
            const player1 = currentTeams[team1].players[Math.floor(Math.random() * currentTeams[team1].players.length)];
            const player2 = currentTeams[team2].players[Math.floor(Math.random() * currentTeams[team2].players.length)];
            
            // Intercambio
            removePlayerFromTeam(currentTeams[team1], player1);
            removePlayerFromTeam(currentTeams[team2], player2);
            
            addPlayerToTeam(currentTeams[team1], player2);
            addPlayerToTeam(currentTeams[team2], player1);
            
            updateTeamStats(currentTeams[team1]);
            updateTeamStats(currentTeams[team2]);
            
            const newScore = calculateTotalBalanceScore(currentTeams, targetMMR);
            const scoreDifference = newScore - bestScore;
            
            // Aceptar mejoras o peores soluciones con probabilidad
            if (scoreDifference > 0 || Math.random() < Math.exp(scoreDifference / temperature)) {
                bestScore = newScore;
                bestTeams = deepCopyTeams(currentTeams);
                console.log(`🔥 SA mejora en iteración ${i}: ${newScore.toFixed(2)} (temp: ${temperature.toFixed(2)})`);
            }
        }
        
        temperature *= coolingRate;
    }
    
    console.log(`📊 Después de Estrategia 2: ${bestScore.toFixed(2)}`);
    
    // Estrategia 3: Optimización específica para MMR alto-bajo
    console.log("⚖️ Estrategia 3: Optimización específica para MMR alto-bajo");
    for (let i = 0; i < 500; i++) {
        const currentTeams = deepCopyTeams(bestTeams);
        
        // Buscar equipos con MMR muy alto y muy bajo
        const highMMRTeams = currentTeams.filter(team => {
            const maxMMR = Math.max(...team.players.map(p => p.mmr));
            return maxMMR >= 7000;
        });
        
        const lowMMRTeams = currentTeams.filter(team => {
            const minMMR = Math.min(...team.players.map(p => p.mmr));
            return minMMR <= 2000;
        });
        
        if (highMMRTeams.length > 0 && lowMMRTeams.length > 0) {
            const highTeam = highMMRTeams[Math.floor(Math.random() * highMMRTeams.length)];
            const lowTeam = lowMMRTeams[Math.floor(Math.random() * lowMMRTeams.length)];
            
            // Encontrar jugadores de MMR extremo
            const highPlayer = highTeam.players.find(p => p.mmr >= 7000);
            const lowPlayer = lowTeam.players.find(p => p.mmr <= 2000);
            
            if (highPlayer && lowPlayer) {
                // Intercambiar jugadores extremos
                removePlayerFromTeam(highTeam, highPlayer);
                removePlayerFromTeam(lowTeam, lowPlayer);
                
                addPlayerToTeam(highTeam, lowPlayer);
                addPlayerToTeam(lowTeam, highPlayer);
                
                updateTeamStats(highTeam);
                updateTeamStats(lowTeam);
                
                const newScore = calculateTotalBalanceScore(currentTeams, targetMMR);
                
                if (newScore > bestScore) {
                    bestScore = newScore;
                    bestTeams = deepCopyTeams(currentTeams);
                    console.log(`⚖️ Mejora MMR alto-bajo en iteración ${i}: ${newScore.toFixed(2)}`);
                }
            }
        }
    }
    
    console.log(`📊 Después de Estrategia 3: ${bestScore.toFixed(2)}`);
    
    // Estrategia 4: Optimización final con intercambios múltiples
    console.log("🎯 Estrategia 4: Optimización final agresiva");
    for (let i = 0; i < 1000; i++) {
        const currentTeams = deepCopyTeams(bestTeams);
        
        // Intercambios múltiples entre varios equipos
        const numSwaps = Math.floor(Math.random() * 4) + 2; // 2-5 intercambios
        
        for (let j = 0; j < numSwaps; j++) {
            const team1 = Math.floor(Math.random() * teams.length);
            const team2 = Math.floor(Math.random() * teams.length);
            
            if (team1 !== team2 && 
                currentTeams[team1].players.length > 0 && 
                currentTeams[team2].players.length > 0) {
                
                const player1 = currentTeams[team1].players[Math.floor(Math.random() * currentTeams[team1].players.length)];
                const player2 = currentTeams[team2].players[Math.floor(Math.random() * currentTeams[team2].players.length)];
                
                removePlayerFromTeam(currentTeams[team1], player1);
                removePlayerFromTeam(currentTeams[team2], player2);
                
                addPlayerToTeam(currentTeams[team1], player2);
                addPlayerToTeam(currentTeams[team2], player1);
                
                updateTeamStats(currentTeams[team1]);
                updateTeamStats(currentTeams[team2]);
            }
        }
        
        const newScore = calculateTotalBalanceScore(currentTeams, targetMMR);
        
        if (newScore > bestScore) {
            bestScore = newScore;
            bestTeams = deepCopyTeams(currentTeams);
            console.log(`🎯 Mejora final en iteración ${i}: ${newScore.toFixed(2)}`);
        }
    }
    
    console.log(`🏆 Score final después de todas las estrategias: ${bestScore.toFixed(2)}`);
    console.log(`📈 Total de iteraciones realizadas: ${iterations + 2500}`);
    
    return bestTeams;
}

// Función para calcular el score total de balance de todos los equipos
function calculateTotalBalanceScore(teams, targetMMR) {
    let totalScore = 0;
    
    // Calcular score individual de cada equipo
    teams.forEach(team => {
        totalScore += calculateTeamBalanceScore(team, targetMMR);
    });
    
    // Bonus por distribución global de MMR
    const allMMRs = teams.flatMap(team => team.players.map(p => p.mmr));
    const globalAvgMMR = allMMRs.reduce((sum, mmr) => sum + mmr, 0) / allMMRs.length;
    
    // Penalización por diferencia total entre equipos
    const teamTotals = teams.map(team => team.totalMMR);
    const maxTotal = Math.max(...teamTotals);
    const minTotal = Math.min(...teamTotals);
    const totalDifference = maxTotal - minTotal;
    
    // Penalización muy severa por diferencias grandes
    totalScore -= totalDifference * 10.0;
    
    // Bonus por equipos con MMR alto-bajo juntos
    teams.forEach(team => {
        if (team.players.length === 5) {
            const mmrs = team.players.map(p => p.mmr);
            const maxMMR = Math.max(...mmrs);
            const minMMR = Math.min(...mmrs);
            
            if (maxMMR >= 7000 && minMMR <= 2000) {
                totalScore += 10000; // Bonus muy alto
            } else if (maxMMR >= 6000 && minMMR <= 3000) {
                totalScore += 5000; // Bonus alto
            } else if (maxMMR >= 5000 && minMMR <= 4000) {
                totalScore += 2000; // Bonus moderado
            }
        }
    });
    
    return totalScore;
}

// Función para remover un jugador de un equipo
function removePlayerFromTeam(team, player) {
    const index = team.players.findIndex(p => 
        p.name === player.name && 
        p.mmr === player.mmr && 
        p.role === player.role
    );
    
    if (index !== -1) {
        const removedPlayer = team.players.splice(index, 1)[0];
        team.totalMMR -= removedPlayer.mmr;
        team.roles.delete(removedPlayer.role);
    }
}

// Función para agregar un jugador a un equipo
function addPlayerToTeam(team, player) {
    team.players.push(player);
    team.totalMMR += player.mmr;
    team.roles.add(player.role);
}

// Función para actualizar estadísticas de un equipo
function updateTeamStats(team) {
    if (team.players.length === 0) {
        team.totalMMR = 0;
        team.roles.clear();
        return;
    }
    
    team.totalMMR = team.players.reduce((sum, player) => sum + player.mmr, 0);
    team.roles.clear();
    team.players.forEach(player => team.roles.add(player.role));
}

// Algoritmo de balanceo por ELO (matchmaking MOBA)
function eloBalanceTeams() {
    if (players.length < 5) {
        alert('Se necesitan al menos 5 jugadores para formar equipos');
        return;
    }
    const numTeams = Math.floor(players.length / 5);
    if (numTeams < 2) {
        alert('Se necesitan al menos 10 jugadores para balancear por ELO');
        return;
    }
    
    console.log("🎯 Iniciando balanceo ELO con roles únicos y balance total MMR...");
    
    // Separar jugadores por roles y ordenar por MMR (descendente)
    const playersByRole = {
        1: players.filter(p => p.role === 1).sort((a, b) => b.mmr - a.mmr), // Carry
        2: players.filter(p => p.role === 2).sort((a, b) => b.mmr - a.mmr), // Mid
        3: players.filter(p => p.role === 3).sort((a, b) => b.mmr - a.mmr), // Offlane
        4: players.filter(p => p.role === 4).sort((a, b) => b.mmr - a.mmr), // Soft Support
        5: players.filter(p => p.role === 5).sort((a, b) => b.mmr - a.mmr)  // Hard Support
    };
    
    let bestTeams = [];
    let bestScore = Infinity;
    let progressCount = 0;
    
    for (let attempt = 0; attempt < 1000500; attempt++) {
        progressCount++;
        if (progressCount % 100000 === 0) {
            console.log(`📊 Progreso: ${progressCount}/${1000500} intentos (${Math.round(progressCount/1000500*100)}%)`);
        }
        
        // Crear equipos vacíos
        let teams = [];
        for (let i = 0; i < numTeams; i++) {
            teams.push({ players: [], totalMMR: 0, roles: new Set() });
        }
        
        // Crear copias de los arrays de roles para no modificar los originales
        const availablePlayers = {
            1: [...playersByRole[1]],
            2: [...playersByRole[2]],
            3: [...playersByRole[3]],
            4: [...playersByRole[4]],
            5: [...playersByRole[5]]
        };
        
        // FASE 1: Intentar asignar un jugador de cada rol a cada equipo
        const roles = [1, 2, 3, 4, 5];
        
        for (const role of roles) {
            // Mezclar el orden de asignación de equipos para este rol
            const teamOrder = Array.from({length: numTeams}, (_, i) => i);
            teamOrder.sort(() => Math.random() - 0.5);
            
            for (const teamIdx of teamOrder) {
                if (availablePlayers[role].length > 0 && teams[teamIdx].players.length < 5) {
                    const player = availablePlayers[role].shift(); // Toma el de MMR más alto
                    teams[teamIdx].players.push(player);
                    teams[teamIdx].totalMMR += player.mmr;
                    teams[teamIdx].roles.add(player.role);
                }
            }
        }
        
        // FASE 2: Completar equipos con jugadores restantes (priorizando MMR alto)
        const remainingPlayers = [];
        for (const role of roles) {
            remainingPlayers.push(...availablePlayers[role]);
        }
        
        // Ordenar jugadores restantes por MMR (descendente)
        remainingPlayers.sort((a, b) => b.mmr - a.mmr);
        
        // Asignar jugadores restantes a equipos incompletos
        for (const player of remainingPlayers) {
            // Encontrar equipo con menos jugadores
            let targetTeam = teams[0];
            for (const team of teams) {
                if (team.players.length < targetTeam.players.length) {
                    targetTeam = team;
                }
            }
            
            if (targetTeam.players.length < 5) {
                targetTeam.players.push(player);
                targetTeam.totalMMR += player.mmr;
                targetTeam.roles.add(player.role);
            }
        }
        
        // Verificar que todos los equipos tengan exactamente 5 jugadores
        if (teams.every(team => team.players.length === 5)) {
            const score = calculateEloMatchmakingScore(teams);
            if (score < bestScore) {
                bestScore = score;
                bestTeams = JSON.parse(JSON.stringify(teams));
                console.log(`✅ Nueva mejor combinación encontrada en intento ${attempt}: Score ${bestScore.toFixed(2)}`);
                
                // Mostrar detalles de la mejora
                console.log("📋 Detalles de la mejora:");
                teams.forEach((team, idx) => {
                    const roleCount = {};
                    team.players.forEach(p => {
                        roleCount[p.role] = (roleCount[p.role] || 0) + 1;
                    });
                    console.log(`Equipo ${idx + 1}: MMR ${team.totalMMR}, Roles:`, roleCount);
                });
            }
        }
    }
    
    // Asignar equipos globales
    teams = bestTeams.map(team => ({
        players: team.players,
        totalMMR: team.players.reduce((sum, p) => sum + p.mmr, 0),
        roles: new Set(team.players.map(p => p.role))
    }));
    
    displayTeams();
    updateStats();
    
    console.log(`🏆 Balanceo ELO completado. Mejor score: ${bestScore.toFixed(2)}`);
    alert(`Balanceo por ELO completado.\nMejor score encontrado: ${bestScore.toFixed(2)}\nTotal de intentos: ${progressCount}`);
}

// Score ELO mejorado que prioriza balance total MMR y respeta roles
function calculateEloMatchmakingScore(teams) {
    let score = 0;
    
    // 1. PRIORIDAD PRINCIPAL: Balance del total MMR entre equipos
    const teamTotals = teams.map(team => team.totalMMR);
    const maxTotal = Math.max(...teamTotals);
    const minTotal = Math.min(...teamTotals);
    const totalDifference = maxTotal - minTotal;
    
    // Penalización muy severa por diferencias grandes en total MMR
    score += totalDifference * 15.0; // Peso muy alto para total MMR
    
    // 2. PRIORIDAD SECUNDARIA: Probabilidad de victoria usando ELO
    let eloImbalance = 0;
    for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
            const mmrA = teams[i].totalMMR;
            const mmrB = teams[j].totalMMR;
            // Fórmula ELO para probabilidad de victoria
            const pA = 1 / (1 + Math.pow(10, (mmrB - mmrA) / 400));
            // Penalizar desviaciones del 50% (equilibrio perfecto)
            eloImbalance += Math.abs(0.5 - pA);
        }
    }
    score += eloImbalance * 5000; // Peso moderado para ELO
    
    // 3. BONUS por roles únicos (cada equipo debe tener 5 roles diferentes)
    for (const team of teams) {
        if (team.roles.size === 5) {
            score -= 1000; // Bonus por equipo con roles únicos
        } else {
            score += (5 - team.roles.size) * 2000; // Penalización por roles faltantes
        }
    }
    
    // 4. Penalización por "stacking" de jugadores extremos
    for (const team of teams) {
        const mmrs = team.players.map(p => p.mmr);
        const superHigh = mmrs.filter(mmr => mmr > 7000).length;
        const superLow = mmrs.filter(mmr => mmr < 2000).length;
        
        // Penalizar equipos con múltiples superestrellas
        if (superHigh > 1) {
            score += 8000 * (superHigh - 1);
        }
        
        // Penalizar equipos con muchos jugadores muy bajos
        if (superLow > 2) {
            score += 4000 * (superLow - 2);
        }
    }
    
    // 5. Bonus por distribución uniforme de MMR
    const allMMRs = teams.flatMap(team => team.players.map(p => p.mmr));
    const globalAvg = allMMRs.reduce((sum, mmr) => sum + mmr, 0) / allMMRs.length;
    
    for (const team of teams) {
        const teamAvg = team.totalMMR / 5;
        const deviation = Math.abs(teamAvg - globalAvg);
        score += deviation * 0.1; // Peso bajo para promedio
    }
    
    return score;
}

// Event listener para el botón de balanceo ELO
window.addEventListener('DOMContentLoaded', () => {
    const eloBtn = document.getElementById('eloBalanceBtn');
    if (eloBtn) {
        eloBtn.onclick = eloBalanceTeams;
    }
});

// Algoritmo clásico de balanceo por roles y MMR
function classicBalanceTeams() {
    if (players.length < 5) {
        alert('Se necesitan al menos 5 jugadores para formar equipos');
        return;
    }
    const numTeams = Math.floor(players.length / 5);
    if (numTeams < 2) {
        alert('Se necesitan al menos 10 jugadores para balancear equipos');
        return;
    }
    
    console.log("🎯 Iniciando balanceo clásico con prioridad de roles únicos y MMR alto...");
    
    // Separar jugadores por roles y ordenar por MMR (descendente)
    const playersByRole = {
        1: players.filter(p => p.role === 1).sort((a, b) => b.mmr - a.mmr),
        2: players.filter(p => p.role === 2).sort((a, b) => b.mmr - a.mmr),
        3: players.filter(p => p.role === 3).sort((a, b) => b.mmr - a.mmr),
        4: players.filter(p => p.role === 4).sort((a, b) => b.mmr - a.mmr),
        5: players.filter(p => p.role === 5).sort((a, b) => b.mmr - a.mmr)
    };
    
    let bestTeams = [];
    let bestScore = Infinity;
    let progressCount = 0;
    let bestAssigned = [];
    
    for (let attempt = 0; attempt < 1000500; attempt++) {
        progressCount++;
        if (progressCount % 100000 === 0) {
            console.log(`📊 Progreso: ${progressCount}/${1000500} intentos (${Math.round(progressCount/1000500*100)}%)`);
        }
        
        // Crear equipos vacíos
        let teams = [];
        for (let i = 0; i < numTeams; i++) {
            teams.push({ players: [], totalMMR: 0, roles: new Set() });
        }
        
        // Crear copias de los arrays de roles para no modificar los originales
        const availablePlayers = {
            1: [...playersByRole[1]],
            2: [...playersByRole[2]],
            3: [...playersByRole[3]],
            4: [...playersByRole[4]],
            5: [...playersByRole[5]]
        };
        
        // FASE 1: Intentar asignar un jugador de cada rol a cada equipo
        const roles = [1, 2, 3, 4, 5];
        for (const role of roles) {
            // Mezclar el orden de asignación de equipos para este rol
            const teamOrder = Array.from({length: numTeams}, (_, i) => i);
            teamOrder.sort(() => Math.random() - 0.5);
            for (const teamIdx of teamOrder) {
                if (availablePlayers[role].length > 0 && teams[teamIdx].players.length < 5 && !teams[teamIdx].roles.has(role)) {
                    const player = availablePlayers[role].shift();
                    teams[teamIdx].players.push(player);
                    teams[teamIdx].totalMMR += player.mmr;
                    teams[teamIdx].roles.add(player.role);
                }
            }
        }
        // FASE 2: Completar equipos con jugadores restantes (priorizando MMR alto)
        const remainingPlayers = [];
        for (const role of roles) {
            remainingPlayers.push(...availablePlayers[role]);
        }
        remainingPlayers.sort((a, b) => b.mmr - a.mmr);
        for (const player of remainingPlayers) {
            // Encontrar equipo con menos jugadores
            let targetTeam = teams[0];
            for (const team of teams) {
                if (team.players.length < targetTeam.players.length) {
                    targetTeam = team;
                }
            }
            if (targetTeam.players.length < 5) {
                targetTeam.players.push(player);
                targetTeam.totalMMR += player.mmr;
                targetTeam.roles.add(player.role);
            }
        }
        // Verificar que todos los equipos tengan exactamente 5 jugadores
        if (teams.every(team => team.players.length === 5)) {
            // Score clásico: solo diferencia de total MMR
            const teamTotals = teams.map(team => team.totalMMR);
            const maxTotal = Math.max(...teamTotals);
            const minTotal = Math.min(...teamTotals);
            const totalDifference = maxTotal - minTotal;
            if (totalDifference < bestScore) {
                bestScore = totalDifference;
                bestTeams = JSON.parse(JSON.stringify(teams));
                // Guardar los jugadores asignados
                bestAssigned = teams.flatMap(team => team.players.map(p => p.id));
                // Mostrar detalles de la mejora
                if (progressCount % 100000 === 0) {
                    console.log("📋 Detalles de la mejora:");
                    teams.forEach((team, idx) => {
                        const roleCount = {};
                        team.players.forEach(p => {
                            roleCount[p.role] = (roleCount[p.role] || 0) + 1;
                        });
                        console.log(`Equipo ${idx + 1}: MMR ${team.totalMMR}, Roles:`, roleCount);
                    });
                }
            }
        }
    }
    // Asignar equipos globales
    teams = bestTeams.map(team => ({
        players: team.players,
        totalMMR: team.players.reduce((sum, p) => sum + p.mmr, 0),
        roles: new Set(team.players.map(p => p.role))
    }));
    // Detectar jugadores sin asignar
    const assignedPlayers = bestAssigned;
    const unassignedPlayers = players.filter(p => !assignedPlayers.includes(p.id));
    if (unassignedPlayers.length > 0) {
        alert(`Atención: ${unassignedPlayers.length} jugador(es) no pudieron ser asignados a un equipo completo de 5. Revísalos en la consola.`);
        console.log('Jugadores sin asignar:', unassignedPlayers.map(p => `${p.name} (ID: ${p.id}, MMR: ${p.mmr}, Rol: ${p.role})`));
    }
    displayTeams();
    updateStats();
    console.log(`🏆 Balanceo clásico completado. Mejor diferencia de MMR: ${bestScore}`);
    alert(`Balanceo clásico completado.\nMejor diferencia de MMR: ${bestScore}\nTotal de intentos: ${progressCount}`);
}

// Asignar el botón al balanceo clásico
window.addEventListener('DOMContentLoaded', () => {
    const classicBtn = document.getElementById('classicBalanceBtn');
    if (classicBtn) {
        classicBtn.onclick = classicBalanceTeams;
    }
});

// Limpiar localStorage al iniciar la página para evitar datos corruptos
window.addEventListener('DOMContentLoaded', () => {
    localStorage.clear();
    // ...código existente...
});