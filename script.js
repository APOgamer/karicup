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
    const teams = createTeamsWithDynamicProgramming(players, numTeams, targetMMR);
    
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
        
        // Asignar jugadores restantes a equipos con espacio
        for (const player of unassignedPlayers) {
            let assigned = false;
            
            // Buscar equipo con menos jugadores
            teams.sort((a, b) => a.players.length - b.players.length);
            
            for (const team of teams) {
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
                console.log(`❌ ERROR: No se pudo asignar ${player.name} - todos los equipos están llenos`);
            }
        }
    } else {
        console.log(`✅ Todos los ${players.length} jugadores han sido asignados correctamente`);
    }
    
    // 8. Optimización final: intercambiar jugadores para reducir la desviación estándar de MMR
    optimizeTeamsStdDev(teams, targetMMR);

    // 9. Revisión final: evitar doble core, priorizar doble support
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

    // 8. Optimización final: intercambiar jugadores para reducir la desviación estándar de MMR
    optimizeTeamsStdDev(teams, targetMMR);

    return teams;
}

// Optimización para reducir la desviación estándar de MMR entre equipos
function optimizeTeamsStdDev(teams, targetMMR) {
    let improved = true;
    let maxTries = 100;
    while (improved && maxTries-- > 0) {
        improved = false;
        // Buscar los dos equipos más desbalanceados
        let maxTeam = teams[0], minTeam = teams[0];
        for (const team of teams) {
            if (team.totalMMR > maxTeam.totalMMR) maxTeam = team;
            if (team.totalMMR < minTeam.totalMMR) minTeam = team;
        }
        // Intentar intercambiar jugadores de rol igual
        let bestSwap = null;
        let bestStdDev = stdDev(teams.map(t => t.totalMMR));
        for (const p1 of maxTeam.players) {
            for (const p2 of minTeam.players) {
                if (p1.role !== p2.role) continue;
                // Simular swap
                let newMaxMMR = maxTeam.totalMMR - p1.mmr + p2.mmr;
                let newMinMMR = minTeam.totalMMR - p2.mmr + p1.mmr;
                let mmrs = teams.map(t => {
                    if (t === maxTeam) return newMaxMMR;
                    if (t === minTeam) return newMinMMR;
                    return t.totalMMR;
                });
                let newStdDev = stdDev(mmrs);
                if (newStdDev < bestStdDev) {
                    bestStdDev = newStdDev;
                    bestSwap = { p1, p2 };
                }
            }
        }
        if (bestSwap) {
            // Realizar swap
            let idx1 = maxTeam.players.indexOf(bestSwap.p1);
            let idx2 = minTeam.players.indexOf(bestSwap.p2);
            maxTeam.players[idx1] = bestSwap.p2;
            minTeam.players[idx2] = bestSwap.p1;
            maxTeam.totalMMR = maxTeam.totalMMR - bestSwap.p1.mmr + bestSwap.p2.mmr;
            minTeam.totalMMR = minTeam.totalMMR - bestSwap.p2.mmr + bestSwap.p1.mmr;
            improved = true;
        }
    }
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
    score -= targetDeviation * 2.0; // Aumentar peso del balance total
    
    // PRIORIDAD 2: Distribución interna (peso menor)
    score -= stdDev * 0.3; // Reducir peso de desviación estándar
    
    // Bonus por roles únicos
    score += team.roles.size * 100;
    
    // Penalizar equipos con muchos jugadores
    score -= team.players.length * 10;
    
    // Penalización especial para equipos con jugadores de MMR muy alto (peso menor)
    const maxMMR = Math.max(...mmrs);
    if (maxMMR > 8000) {
        score -= (maxMMR - 8000) * 0.1; // Reducir penalización
    }
    
    // Bonus por equipos con MMR más uniforme (peso menor)
    const minMMR = Math.min(...mmrs);
    const mmrRange = maxMMR - minMMR;
    score -= mmrRange * 0.05; // Reducir penalización del rango
    
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
    const maxIterations = 50; // Aumentar iteraciones
    
    while (iterations < maxIterations) {
        iterations++;
        
        // PRIORIDAD 1: Encontrar equipos con mayor y menor MMR total
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
        
        // Si la diferencia de MMR total es muy pequeña, terminar
        if (maxMMR - minMMR < targetMMR * 0.05) break;
        
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
                const currentDiff = maxMMR - minMMR;
                const newDiff = Math.abs(newMaxMMR - newMinMMR);
                const totalImprovement = currentDiff - newDiff;
                
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
                
                const totalScore = totalImprovement * 10 + internalImprovement * 0.1; // Priorizar balance total
                
                if (totalScore > bestImprovement) {
                    bestImprovement = totalScore;
                    bestSwap = { player1, player2, newMaxMMR, newMinMMR, tempMaxTeam, tempMinTeam };
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
                
                console.log(`Intercambio total: ${player1.name} (${player1.role}) ↔ ${player2.name} (${player2.role}) - Mejora total: ${bestImprovement.toFixed(2)}`);
            }
        } else {
            // Si no se encontró mejora en balance total, intentar optimización específica
            if (!optimizeByTotalMMR(teams, targetMMR)) {
                break;
            }
        }
    }
    
    console.log(`Optimización total completada en ${iterations} iteraciones`);
}

// Optimización específica por total MMR
function optimizeByTotalMMR(teams, targetMMR) {
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
    
    // Buscar intercambios que mejoren significativamente el balance del total
    const maxPlayers = maxTeam.players.sort((a, b) => b.mmr - a.mmr);
    const minPlayers = minTeam.players.sort((a, b) => a.mmr - b.mmr);
    
    // Intentar intercambiar jugadores con mayor diferencia de MMR
    for (const highPlayer of maxPlayers.slice(0, 3)) {
        for (const lowPlayer of minPlayers.slice(0, 3)) {
            if (highPlayer.role === lowPlayer.role) continue;
            
            // Verificar que el intercambio no rompa roles
            if (maxTeam.roles.has(lowPlayer.role) || minTeam.roles.has(highPlayer.role)) continue;
            
            // Calcular mejora en balance total
            const newMaxMMR = maxTeam.totalMMR - highPlayer.mmr + lowPlayer.mmr;
            const newMinMMR = minTeam.totalMMR - lowPlayer.mmr + highPlayer.mmr;
            
            const currentDiff = maxMMR - minMMR;
            const newDiff = Math.abs(newMaxMMR - newMinMMR);
            const improvement = currentDiff - newDiff;
            
            // Solo hacer el intercambio si mejora significativamente el balance total
            if (improvement > 1000) {
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
                
                console.log(`Optimización total MMR: ${highPlayer.name} (${highPlayer.role}) ↔ ${lowPlayer.name} (${lowPlayer.role}) - Mejora: ${improvement}`);
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
        { name: "Artyk-[Sebas-]", id: "199455408", mmr: 5900, role: 3 },
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
        { name: "Desux", id: "1289611343", mmr: 7044, role: 5 },
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
    
    const teamStats = teams.map((team, index) => ({
        team: index + 1,
        totalMMR: team.totalMMR,
        averageMMR: team.players.length > 0 ? team.totalMMR / team.players.length : 0,
        players: team.players.length,
        difference: Math.abs(team.totalMMR - avgMMR)
    }));
    
    statsContainer.innerHTML = `
        <div class="stats">
            <h3>📊 Estadísticas de Equipos</h3>
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
                    <div class="stat-label">Mayor Diferencia de MMR</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${minDifference}</div>
                    <div class="stat-label">Menor Diferencia de MMR</div>
                </div>
            </div>
            
            <h4 style="margin-top: 20px; color: #ffd700;">Detalles por Equipo:</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 15px;">
                ${teamStats.map(stat => `
                    <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 18px; font-weight: bold; color: #ffd700;">Equipo ${stat.team}</div>
                        <div style="margin-top: 10px;">
                            <div>Total MMR: <strong>${stat.totalMMR}</strong></div>
                            <div>Promedio: <strong>${Math.round(stat.averageMMR)}</strong></div>
                            <div>Jugadores: <strong>${stat.players}/5</strong></div>
                            <div>Diferencia: <strong>${stat.difference}</strong></div>
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
    const saved = localStorage.getItem('dota2Players');
    if (saved) {
        players = JSON.parse(saved);
        // Asegurar que todos los jugadores tengan índice
        players.forEach((player, index) => {
            player.index = index;
        });
        console.log(`${players.length} jugadores cargados desde localStorage`);
    }
}