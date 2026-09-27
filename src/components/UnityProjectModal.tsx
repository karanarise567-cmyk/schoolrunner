import React, { useState } from 'react';
import { X, Copy, Check, Download, Folder, FileCode, Layers, Smartphone, Monitor, Zap, Video } from 'lucide-react';

interface UnityProjectModalProps {
  onClose: () => void;
}

const UNITY_SCRIPTS = [
  {
    fileName: 'StaminaSystem.cs',
    folder: 'Assets/Scripts/',
    description: 'Implements Rules 1-5: Default speed (12 m/s), potential distance calculation (180s = 2160m), stamina-speed scaling, min speed limit (default/3 at <=20%), and 20% UI vibration.',
    code: `using UnityEngine;
using UnityEngine.UI;

/// <summary>
/// School Runner - Stamina System (7 Rules Implementation)
/// 
/// RULE 1: Default Speed = 12 m/s (base speed).
/// RULE 2: Distance calculated in mentioned time: 180s * 12 m/s = 2160m (Target: 1000m).
/// RULE 3: Default stamina 100% = 100% of default speed (12 m/s).
/// RULE 4: As stamina lowers, player speed goes down, but CANNOT go below default speed / 3 (if stamina <= 20%).
/// RULE 5: Stamina meter starts vibrating at level 20% and maintains that level.
/// </summary>
public class StaminaSystem : MonoBehaviour
{
    public static StaminaSystem Instance;

    [Header("Rule 1 & 2: Speed & Distance Settings")]
    [Tooltip("Default speed when stamina is 100% (Rule 1)")]
    public float defaultSpeed = 12f; // 12 m/s

    [Tooltip("Mentioned race time in seconds (Rule 2)")]
    public float raceTimeSeconds = 180f; // 3:00 minutes

    // Rule 2 calculation
    public float CalculatedPotentialDistance => defaultSpeed * raceTimeSeconds; // 2160 meters

    [Header("Rule 3 & 4: Stamina Settings")]
    public float maxStamina = 100f;
    public float currentStamina = 100f;
    public float staminaLossPerSecond = 2f; // Drains while player is moving

    [Header("Rule 5: Stamina Meter Vibration")]
    public RectTransform staminaMeterContainer; // RectTransform to shake
    public float vibrationFrequency = 35f;
    public float vibrationIntensity = 4f;
    private Vector2 originalMeterPosition;

    [Header("UI Elements")]
    public Slider staminaSlider;
    public Text staminaText;
    public Text speedInfoText; // Optional: shows live m/s

    [Header("Live State (Read Only)")]
    public bool isRunning = false;
    public bool isBoosting = false;
    public bool isVibrating = false;

    private void Awake()
    {
        if (Instance == null) Instance = this;
        else Destroy(gameObject);
    }

    private void Start()
    {
        currentStamina = maxStamina;
        if (staminaMeterContainer != null)
        {
            originalMeterPosition = staminaMeterContainer.anchoredPosition;
        }

        UpdateUI();
    }

    private void Update()
    {
        // Stamina drain ONLY while moving
        if (isRunning && currentStamina > 0f)
        {
            float drainRate = isBoosting ? 5f : staminaLossPerSecond;
            currentStamina -= drainRate * Time.deltaTime;
        }

        // Clamp between 0 and 100
        currentStamina = Mathf.Clamp(currentStamina, 0f, maxStamina);

        // Turn off boost when empty
        if (currentStamina <= 0f && isBoosting)
        {
            isBoosting = false;
        }

        // RULE 5: Stamina meter vibrates at level 20% and maintains that level
        HandleMeterVibration();

        UpdateUI();
    }

    /// <summary>
    /// RULES 3 & 4: Returns speed multiplier.
    /// - 100% Stamina = 1.0 (equals default speed).
    /// - Between 100% and 20%: speed goes down smoothly.
    /// - At or below 20%: cannot go below default speed / 3 (min multiplier = 0.3333).
    /// </summary>
    public float GetStaminaSpeedMultiplier()
    {
        float minFraction = 1f / 3f; // Cannot go below default speed / 3

        if (currentStamina >= 20f)
        {
            // Linear ratio from 20% (0.0) to 100% (1.0)
            float ratio = (currentStamina - 20f) / (maxStamina - 20f);
            return minFraction + (1f - minFraction) * ratio;
        }
        else
        {
            // Clamped at default speed / 3
            return minFraction;
        }
    }

    /// <summary>
    /// RULE 5: Vibrates stamina meter while currentStamina <= 20%
    /// </summary>
    private void HandleMeterVibration()
    {
        isVibrating = (currentStamina <= 20f);

        if (staminaMeterContainer != null)
        {
            if (isVibrating)
            {
                float offsetX = Mathf.Sin(Time.time * vibrationFrequency) * vibrationIntensity;
                float offsetY = Mathf.Cos(Time.time * vibrationFrequency * 1.3f) * (vibrationIntensity * 0.6f);
                staminaMeterContainer.anchoredPosition = originalMeterPosition + new Vector2(offsetX, offsetY);
            }
            else
            {
                staminaMeterContainer.anchoredPosition = originalMeterPosition;
            }
        }
    }

    public void SetRunning(bool running)
    {
        isRunning = running;
    }

    public void SetBoosting(bool boosting)
    {
        if (currentStamina <= 0f)
        {
            isBoosting = false;
            return;
        }
        isBoosting = boosting;
    }

    public void RestoreStamina(float amount)
    {
        currentStamina += amount;
        currentStamina = Mathf.Clamp(currentStamina, 0f, maxStamina);
        UpdateUI();
    }

    private void UpdateUI()
    {
        if (staminaSlider != null)
        {
            staminaSlider.maxValue = maxStamina;
            staminaSlider.value = currentStamina;
        }

        if (staminaText != null)
        {
            string vibrLabel = isVibrating ? " [📳 LOW STAMINA]" : "";
            staminaText.text = $"⚡ STAMINA: {Mathf.CeilToInt(currentStamina)}/{Mathf.CeilToInt(maxStamina)}{vibrLabel}";
        }

        if (speedInfoText != null)
        {
            float effectiveSpeed = defaultSpeed * GetStaminaSpeedMultiplier() * (isBoosting ? 1.5f : 1.0f);
            speedInfoText.text = $"Speed: {effectiveSpeed:F1} m/s (Def: {defaultSpeed} m/s)";
        }
    }
}`,
  },
  {
    fileName: 'PlayerMovement.cs',
    folder: 'Assets/Scripts/',
    description: 'Implements Rules 4, 6 & 7: Speed scaled by stamina, hurdle slowdown (Rule 6), and unscaled actual clock running (Rule 7).',
    code: `using UnityEngine;

/// <summary>
/// Attach to Player GameObject.
/// Implements Rules 4, 6, and 7:
/// - RULE 4: Speed based on StaminaSystem (min defaultSpeed / 3).
/// - RULE 6: Hurdles slows the player!
/// - RULE 7: Only the speed gets slow; time keeps running at actual speed.
/// </summary>
public class PlayerMovement : MonoBehaviour
{
    [Header("Joystick")]
    public FixedJoystick joystick;

    [Header("Stamina System Reference")]
    public StaminaSystem staminaSystem;

    [Header("Rule 6: Hurdle Slowdown Settings")]
    public float hurdleSlowdownMultiplier = 0.55f; // Slowed by 45% when hitting hurdles
    private float hurdleSlowdownTimer = 0f;

    [Header("Free Horizontal Steering Settings")]
    [Tooltip("Speed at which player glides horizontally when pressing/holding A or D")]
    public float steerSpeed = 8f; // Units per second
    public float roadLeftLimit = -3.8f;
    public float roadRightLimit = 3.8f;

    void Start()
    {
        if (staminaSystem == null) staminaSystem = StaminaSystem.Instance;
    }

    void Update()
    {
        // Read continuous free movement input (Holding A / D or Left / Right arrows)
        float hInput = 0f;
        if (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow)) hInput -= 1f;
        if (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow)) hInput += 1f;

        if (joystick != null && Mathf.Abs(joystick.Horizontal) > 0.05f)
        {
            hInput = joystick.Horizontal;
        }

        // Inform stamina system if moving
        if (staminaSystem != null)
        {
            staminaSystem.SetRunning(true);
        }

        // 1. Calculate Base Speed (RULES 1, 3, 4)
        float baseSpeed = (staminaSystem != null) ? staminaSystem.defaultSpeed : 12f;
        float staminaMultiplier = (staminaSystem != null) ? staminaSystem.GetStaminaSpeedMultiplier() : 1.0f;
        float boostMultiplier = (staminaSystem != null && staminaSystem.isBoosting) ? 1.5f : 1.0f;

        float currentSpeed = baseSpeed * staminaMultiplier * boostMultiplier;

        // 2. RULE 6: Hurdles slows the player
        if (hurdleSlowdownTimer > 0f)
        {
            // RULE 7: Time.deltaTime runs at actual normal speed
            hurdleSlowdownTimer -= Time.deltaTime;
            currentSpeed *= hurdleSlowdownMultiplier;
        }

        // 3. Move forward at calculated speed
        transform.Translate(Vector3.forward * (currentSpeed * Time.deltaTime));

        // 4. FREE CONTINUOUS HORIZONTAL STEERING
        // Allows dodging anywhere across the road without being locked to fixed lanes
        Vector3 pos = transform.position;
        pos.x += hInput * steerSpeed * Time.deltaTime;
        pos.x = Mathf.Clamp(pos.x, roadLeftLimit, roadRightLimit);
        transform.position = pos;
    }

    /// <summary>
    /// RULE 6: Called when colliding with ground hurdles (pothole, puddle, speed bump, barricade).
    /// RULE 7: Only the speed gets slow; time keeps running at actual speed!
    /// </summary>
    public void HitHurdle(float duration = 2.0f)
    {
        hurdleSlowdownTimer = duration;
        Debug.Log("Hurdle Hit! Player speed slowed down for " + duration + "s.");
    }
}`,
  },
  {
    fileName: 'HurdleObstacle.cs',
    folder: 'Assets/Scripts/',
    description: 'Attached to potholes, puddles, speed bumps, and barricades. Slows the player on contact (Rule 6).',
    code: `using UnityEngine;

/// <summary>
/// Attach this script to Potholes, Water Puddles, Speed Bumps, and Barricades.
/// Ensure Collider has 'Is Trigger' checked and Tag is set to 'Obstacle' or 'Hurdle'.
/// </summary>
public class HurdleObstacle : MonoBehaviour
{
    [Header("Slowdown Settings (Rule 6)")]
    public float slowdownDuration = 2.0f; // Slows player for 2.0s
    private bool hasTriggered = false;

    private void OnTriggerEnter(Collider other)
    {
        if (hasTriggered) return;

        if (other.CompareTag("Player"))
        {
            PlayerMovement player = other.GetComponent<PlayerMovement>();
            if (player != null)
            {
                player.HitHurdle(slowdownDuration);
                hasTriggered = true;
            }
        }
    }
}`,
  },
  {
    fileName: 'StaminaBoostButton.cs',
    folder: 'Assets/Scripts/',
    description: 'Attached to STAMINA button. Uses IPointerDownHandler & IPointerUpHandler for temporary speed boost.',
    code: `using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

public class StaminaBoostButton : MonoBehaviour, IPointerDownHandler, IPointerUpHandler, IPointerExitHandler
{
    public Image buttonImage;
    public Color normalColor = new Color(0.1f, 0.4f, 0.9f, 1f);
    public Color boostingColor = new Color(0.1f, 0.8f, 1f, 1f);
    public Color emptyColor = new Color(0.3f, 0.3f, 0.3f, 0.6f);

    private bool isPressed = false;

    void Update()
    {
        if (StaminaSystem.Instance == null) return;

        if (buttonImage != null)
        {
            if (StaminaSystem.Instance.currentStamina <= 0f)
                buttonImage.color = emptyColor;
            else if (isPressed)
                buttonImage.color = boostingColor;
            else
                buttonImage.color = normalColor;
        }
    }

    public void OnPointerDown(PointerEventData eventData)
    {
        if (StaminaSystem.Instance != null && StaminaSystem.Instance.currentStamina > 0f)
        {
            isPressed = true;
            StaminaSystem.Instance.SetBoosting(true);
        }
    }

    public void OnPointerUp(PointerEventData eventData) => Release();
    public void OnPointerExit(PointerEventData eventData) => Release();

    private void Release()
    {
        if (isPressed)
        {
            isPressed = false;
            if (StaminaSystem.Instance != null)
            {
                StaminaSystem.Instance.SetBoosting(false);
            }
        }
    }
}`,
  },
  {
    fileName: 'DrinkPickup.cs',
    folder: 'Assets/Scripts/',
    description: 'Restores stamina: Water (+20), Cold Drink (+30), Nimbu (+50), Lassi (+70). Clamped to 100.',
    code: `using UnityEngine;

public enum DrinkType { WaterBottle, ColdDrink, NimbuPani, Lassi }

public class DrinkPickup : MonoBehaviour
{
    public DrinkType drinkType = DrinkType.WaterBottle;
    public float rotateSpeed = 90f;

    public float StaminaRestoreAmount
    {
        get
        {
            switch (drinkType)
            {
                case DrinkType.WaterBottle: return 20f;
                case DrinkType.ColdDrink: return 30f;
                case DrinkType.NimbuPani: return 50f;
                case DrinkType.Lassi: return 70f;
                default: return 20f;
            }
        }
    }

    void Update()
    {
        transform.Rotate(Vector3.up, rotateSpeed * Time.deltaTime);
    }

    private void OnTriggerEnter(Collider other)
    {
        if (other.CompareTag("Player"))
        {
            if (StaminaSystem.Instance != null)
            {
                StaminaSystem.Instance.RestoreStamina(StaminaRestoreAmount);
            }
            Destroy(gameObject);
        }
    }
}`,
  },
  {
    fileName: 'TwoSeaterCycleTraffic.cs',
    folder: 'Assets/Scripts/',
    description: 'Attached to 2-Seater Bicycle traffic prefabs. Moving faster than player, allows catching a lift onto the rear seat.',
    code: `using UnityEngine;

/// <summary>
/// Attach to 2-Seater Bicycle traffic obstacle/vehicle.
/// Moves along road faster than running player.
/// If Player activates Cycle Lift Jugaad and touches/collides with this bicycle,
/// the player hitches onto the rear seat (double-seat ride) with zero stamina drain!
/// </summary>
public class TwoSeaterCycleTraffic : MonoBehaviour
{
    [Header("Bicycle Movement Settings")]
    public float cycleForwardSpeed = 16f; // Faster than player running speed
    public Transform rearSeatMountPoint; // Empty back carrier seat for passenger

    [Header("Visual Indicators")]
    public GameObject emptySeatHighlightGlow;

    private bool hasPassenger = false;

    void Update()
    {
        // 1. Move forward down the road faster than running students
        if (!hasPassenger)
        {
            transform.Translate(Vector3.forward * (cycleForwardSpeed * Time.deltaTime));
        }

        // 2. Highlight empty rear seat if player has requested a lift
        if (emptySeatHighlightGlow != null)
        {
            bool isSeeking = JugaadManager.Instance != null && JugaadManager.Instance.isSeekingCycleLift;
            emptySeatHighlightGlow.SetActive(isSeeking && !hasPassenger);
        }
    }

    private void OnTriggerEnter(Collider other)
    {
        if (hasPassenger) return;

        if (other.CompareTag("Player"))
        {
            PlayerMovement player = other.GetComponent<PlayerMovement>();
            if (JugaadManager.Instance != null && JugaadManager.Instance.isSeekingCycleLift)
            {
                // SUCCESS! Player takes a lift on the back seat!
                hasPassenger = true;
                JugaadManager.Instance.OnCycleLiftBoarded(this, player);
            }
            else
            {
                // Gentle street bump: rings bell and minor nudge
                Debug.Log("Ting-Ting! 🔔 Watch out!");
                if (player != null) player.HitHurdle(0.6f);
            }
        }
    }
}`,
  },
  {
    fileName: 'BusFootboardTraffic.cs',
    folder: 'Assets/Scripts/',
    description: 'Attached to City Bus traffic prefabs. Moving ahead on the road, allows student to catch the rear ladder/footboard and hang onto the back.',
    code: `using UnityEngine;

/// <summary>
/// Attach to City Bus traffic prefab.
/// When Player activates Bus Jugaad (Bus Footboard Lift),
/// approaching the rear footboard triggers the "Footboard Catch" state!
/// The student hangs onto the rear chrome handles/ladder with zero stamina drain
/// while the bus plows forward through traffic at ramming speed.
/// </summary>
public class BusFootboardTraffic : MonoBehaviour
{
    [Header("Bus Settings")]
    public float busForwardSpeed = 18f;
    public Transform rearFootboardMountPoint; // Mount point at rear bumper

    [Header("Visual Cues")]
    public GameObject footboardHighlightGlow;

    private bool hasHangingPassenger = false;

    void Update()
    {
        if (!hasHangingPassenger)
        {
            transform.Translate(Vector3.forward * (busForwardSpeed * Time.deltaTime));
        }

        if (footboardHighlightGlow != null)
        {
            bool isSeeking = JugaadManager.Instance != null && JugaadManager.Instance.isSeekingBusFootboard;
            footboardHighlightGlow.SetActive(isSeeking && !hasHangingPassenger);
        }
    }

    private void OnTriggerEnter(Collider other)
    {
        if (hasHangingPassenger) return;

        if (other.CompareTag("Player"))
        {
            PlayerMovement player = other.GetComponent<PlayerMovement>();
            if (JugaadManager.Instance != null && JugaadManager.Instance.isSeekingBusFootboard)
            {
                // SUCCESS! Caught rear footboard!
                hasHangingPassenger = true;
                JugaadManager.Instance.OnBusFootboardBoarded(this, player);
            }
        }
    }
}`,
  },
  {
    fileName: 'LeftSideEnvironmentSpawner.cs',
    folder: 'Assets/Scripts/Environment/',
    description: 'Spawns and pools decorative 2.5D Indian street environment prefabs strictly along the LEFT side of the 3 playable lanes.',
    code: `using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Spawns 2.5D / isometric decorative environmental assets on the LEFT SIDE of the road.
/// Keeps all 3 center playable lanes completely clear of obstacles/colliders.
/// Features object pooling, level-theming (Levels 1 to 10), and synchronized scroll.
/// </summary>
public class LeftSideEnvironmentSpawner : MonoBehaviour
{
    [Header("Spawn Settings")]
    public float roadLeftBoundaryX = -4.5f; // Left curb position
    public float minSpawnDistanceX = -1.2f; // Distance from left curb outward
    public float maxSpawnDistanceX = -4.0f; // Farther background depth
    public float spawnIntervalZ = 12f;      // Spacing along forward path
    public float despawnZOffset = -15f;     // Behind camera despawn point
    public float spawnAheadZ = 80f;         // Spawning ahead of player

    [Header("Level 1-10 Prefab Categories")]
    public GameObject[] residentialBuildings;
    public GameObject[] cafesAndChaiStalls;
    public GameObject[] stationeryShops;
    public GameObject[] generalStores;
    public GameObject[] busStops;
    public GameObject[] brickWalls;
    public GameObject[] treesAndBushes;
    public GameObject[] streetProps; // dustbins, benches, electric poles, cycle racks

    private List<GameObject> activeSideProps = new List<GameObject>();
    private float nextSpawnZ = 0f;

    void Start()
    {
        // Pre-populate left side environment ahead of player
        for (float z = 0f; z < spawnAheadZ; z += spawnIntervalZ)
        {
            SpawnLeftProp(z);
        }
        nextSpawnZ = spawnAheadZ;
    }

    void Update()
    {
        if (PlayerMovement.Instance == null) return;

        float playerZ = PlayerMovement.Instance.transform.position.z;

        // 1. Recycle/despawn props that passed behind the player
        for (int i = activeSideProps.Count - 1; i >= 0; i--)
        {
            if (activeSideProps[i] != null && activeSideProps[i].transform.position.z < playerZ + despawnZOffset)
            {
                Destroy(activeSideProps[i]);
                activeSideProps.RemoveAt(i);
            }
        }

        // 2. Spawn new decorative props ahead on left side
        if (nextSpawnZ < playerZ + spawnAheadZ)
        {
            SpawnLeftProp(nextSpawnZ);
            nextSpawnZ += spawnIntervalZ + Random.Range(-2f, 3f);
        }
    }

    private void SpawnLeftProp(float zPos)
    {
        GameObject prefab = SelectPrefabForCurrentLevel();
        if (prefab == null) return;

        float xOffset = Random.Range(minSpawnDistanceX, maxSpawnDistanceX);
        Vector3 spawnPos = new Vector3(roadLeftBoundaryX + xOffset, 0f, zPos);

        GameObject prop = Instantiate(prefab, spawnPos, Quaternion.Euler(0f, 90f, 0f), transform);
        
        // Ensure decorative object never interferes with player physics
        Collider col = prop.GetComponent<Collider>();
        if (col != null) col.isTrigger = true;

        activeSideProps.Add(prop);
    }

    private GameObject SelectPrefabForCurrentLevel()
    {
        int level = GameManager.Instance != null ? GameManager.Instance.CurrentLevelIndex : 0;
        
        // Return thematic prefabs depending on Mohalla, Sabzi Market, Bus Stop, School Road, etc.
        switch (level)
        {
            case 0: return GetRandom(residentialBuildings, brickWalls, treesAndBushes);
            case 2: return GetRandom(busStops, cafesAndChaiStalls, streetProps);
            case 3: return GetRandom(stationeryShops, cafesAndChaiStalls, brickWalls);
            case 9: return GetRandom(stationeryShops, treesAndBushes, streetProps);
            default: return GetRandom(generalStores, cafesAndChaiStalls, treesAndBushes);
        }
    }

    private GameObject GetRandom(params GameObject[][] arrays)
    {
        List<GameObject> combined = new List<GameObject>();
        foreach (var arr in arrays) { if (arr != null) combined.AddRange(arr); }
        if (combined.Count == 0) return null;
        return combined[Random.Range(0, combined.Count)];
    }
}`,
  },
  {
    fileName: 'RightSideEnvironmentSpawner.cs',
    folder: 'Assets/Scripts/Environment/',
    description: 'Spawns and pools decorative 2.5D Indian street environment prefabs strictly along the RIGHT side of the 3 playable lanes.',
    code: `using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Spawns 2.5D / isometric decorative environmental assets on the RIGHT SIDE of the road.
/// Keeps all 3 center playable lanes completely clear of obstacles/colliders.
/// Staggers spawn positions from the left side so the street looks organic and asymmetrical.
/// </summary>
public class RightSideEnvironmentSpawner : MonoBehaviour
{
    [Header("Spawn Settings")]
    public float roadRightBoundaryX = 4.5f; // Right curb position
    public float minSpawnDistanceX = 1.2f;  // Distance from right curb outward
    public float maxSpawnDistanceX = 4.0f;  // Farther background depth
    public float spawnIntervalZ = 13.5f;    // Staggered interval
    public float despawnZOffset = -15f;     // Behind camera despawn point
    public float spawnAheadZ = 80f;

    [Header("Level 1-10 Prefab Categories")]
    public GameObject[] shopsAndAwnings;
    public GameObject[] cafesAndStalls;
    public GameObject[] stationeryStores;
    public GameObject[] busStopShelters;
    public GameObject[] wallsAndFences;
    public GameObject[] plantsAndTrees;
    public GameObject[] streetProps; // electric poles, benches, dustbins, ad boards

    private List<GameObject> activeRightProps = new List<GameObject>();
    private float nextSpawnZ = 6f; // Staggered start offset from left side

    void Start()
    {
        for (float z = 6f; z < spawnAheadZ; z += spawnIntervalZ)
        {
            SpawnRightProp(z);
        }
        nextSpawnZ = spawnAheadZ;
    }

    void Update()
    {
        if (PlayerMovement.Instance == null) return;

        float playerZ = PlayerMovement.Instance.transform.position.z;

        // Recycle passed props
        for (int i = activeRightProps.Count - 1; i >= 0; i--)
        {
            if (activeRightProps[i] != null && activeRightProps[i].transform.position.z < playerZ + despawnZOffset)
            {
                Destroy(activeRightProps[i]);
                activeRightProps.RemoveAt(i);
            }
        }

        // Spawn new props ahead on right side
        if (nextSpawnZ < playerZ + spawnAheadZ)
        {
            SpawnRightProp(nextSpawnZ);
            nextSpawnZ += spawnIntervalZ + Random.Range(-2f, 3f);
        }
    }

    private void SpawnRightProp(float zPos)
    {
        GameObject prefab = SelectPrefabForCurrentLevel();
        if (prefab == null) return;

        float xOffset = Random.Range(minSpawnDistanceX, maxSpawnDistanceX);
        Vector3 spawnPos = new Vector3(roadRightBoundaryX + xOffset, 0f, zPos);

        GameObject prop = Instantiate(prefab, spawnPos, Quaternion.Euler(0f, -90f, 0f), transform);

        // Ensure decorative object never blocks player lanes
        Collider col = prop.GetComponent<Collider>();
        if (col != null) col.isTrigger = true;

        activeRightProps.Add(prop);
    }

    private GameObject SelectPrefabForCurrentLevel()
    {
        int level = GameManager.Instance != null ? GameManager.Instance.CurrentLevelIndex : 0;

        switch (level)
        {
            case 0: return GetRandom(shopsAndAwnings, wallsAndFences, plantsAndTrees);
            case 2: return GetRandom(busStopShelters, cafesAndStalls, streetProps);
            case 3: return GetRandom(stationeryStores, streetProps, plantsAndTrees);
            case 9: return GetRandom(cafesAndStalls, plantsAndTrees, streetProps);
            default: return GetRandom(shopsAndAwnings, cafesAndStalls, plantsAndTrees);
        }
    }

    private GameObject GetRandom(params GameObject[][] arrays)
    {
        List<GameObject> combined = new List<GameObject>();
        foreach (var arr in arrays) { if (arr != null) combined.AddRange(arr); }
        if (combined.Count == 0) return null;
        return combined[Random.Range(0, combined.Count)];
    }
}`,
  },
  {
    fileName: 'CameraFollow.cs',
    folder: 'Assets/Scripts/Camera/',
    description: 'Wide Camera View with smooth horizontal damping, mobile portrait auto-scaling, and lower-middle player framing.',
    code: `using UnityEngine;

/// <summary>
/// WIDE CAMERA VIEW & SMOOTH FOLLOW for Mobile Portrait Runner.
/// Provides a wide, spacious street framing:
/// - Captures all 3 playable road lanes clearly
/// - Displays both Left & Right roadside environments (shops, cafes, bus shelters, trees)
/// - Positions player comfortably in the lower-middle portion of screen (giving ~70% forward lookahead reaction time)
/// - Smooth horizontal damping (no jarring camera shake)
/// 
/// RECOMMENDED UNITY INSPECTOR SETTINGS:
/// -------------------------------------
/// Orthographic Camera:
/// - Projection: Orthographic
/// - Size: 7.0 (range: 6.5 to 8.0 depending on mobile aspect ratio)
/// - Position: (0, 8.5, -6.5) relative to player
/// - Rotation: (50, 0, 0)
///
/// Perspective Camera (Alternative):
/// - Projection: Perspective
/// - Field of View (FOV): 58 to 62 degrees
/// - Position: (0, 7.8, -7.2) relative to player
/// - Rotation: (46, 0, 0)
/// </summary>
public class CameraFollow : MonoBehaviour
{
    [Header("Target Follow")]
    public Transform target; // The Player Transform
    
    [Header("Wide Camera Framing (Lower-Middle Placement)")]
    public Vector3 cameraOffset = new Vector3(0f, 8.5f, -6.5f);
    public Vector3 cameraRotation = new Vector3(50f, 0f, 0f);

    [Header("Smooth Damping Settings")]
    [Range(0.01f, 0.5f)]
    public float smoothTimeX = 0.15f; // Gentle horizontal follow (prevents camera shake)
    public float smoothTimeZ = 0.05f; // Fast, responsive forward tracking
    public float maxHorizontalFollowDistance = 1.2f; // Deadzone limit

    [Header("Orthographic Resolution Scaling")]
    public bool autoScaleForMobilePortrait = true;
    public float targetAspect = 9f / 16f; // Standard mobile portrait ratio
    public float baseOrthographicSize = 7.0f; // Wide view baseline

    private Vector3 currentVelocity;
    private Camera cam;

    void Awake()
    {
        cam = GetComponent<Camera>();
        transform.rotation = Quaternion.Euler(cameraRotation);
        ApplyWideAspectScaling();
    }

    void Start()
    {
        if (target == null && PlayerMovement.Instance != null)
        {
            target = PlayerMovement.Instance.transform;
        }

        if (target != null)
        {
            transform.position = target.position + cameraOffset;
        }
    }

    void LateUpdate()
    {
        if (target == null) return;

        // 1. Calculate desired camera position
        // Target Z moves forward with the player
        // Target X follows smoothly with subtle damping
        float desiredX = target.position.x * 0.25f; // Soft tracking prevents nausea/shake
        desiredX = Mathf.Clamp(desiredX, -maxHorizontalFollowDistance, maxHorizontalFollowDistance);

        Vector3 desiredPosition = new Vector3(
            desiredX + cameraOffset.x,
            cameraOffset.y,
            target.position.z + cameraOffset.z
        );

        // 2. Smoothly damp towards desired position
        transform.position = Vector3.SmoothDamp(
            transform.position,
            desiredPosition,
            ref currentVelocity,
            smoothTimeX
        );
    }

    /// <summary>
    /// Adjusts orthographic size automatically for ultra-tall or wider mobile phones
    /// so the 3 lanes and both side environments always remain perfectly framed.
    /// </summary>
    private void ApplyWideAspectScaling()
    {
        if (!autoScaleForMobilePortrait || cam == null || !cam.orthographic) return;

        float currentAspect = (float)Screen.width / Screen.height;
        if (currentAspect < targetAspect)
        {
            // Taller phone (e.g. 19.5:9): Increase ortho size to preserve horizontal street width
            cam.orthographicSize = baseOrthographicSize * (targetAspect / currentAspect);
        }
        else
        {
            cam.orthographicSize = baseOrthographicSize;
        }
    }
}`,
  },
  {
    fileName: 'WrongSideVehicle.cs',
    folder: 'Assets/Scripts/Traffic/',
    description: 'Attach to vehicle prefabs (scooters, autos, delivery bikes). Moves head-on down the lane towards the player at high speed and triggers Game Over on collision.',
    code: `using UnityEngine;

/// <summary>
/// Attach this script to your Vehicle Prefab (Scooter, Auto, Car, Bike).
/// Moves the vehicle head-on in the lane towards the player at high speed.
/// 
/// ROAD ORIENTATION NOTE:
/// - If your road is vertical with the player running up (or camera looking top-down with forward movement):
///   Set moveDirection = Vector3.down (vehicle moves down towards player).
/// - If your road orientation is bottom-up (player moving down):
///   Set moveDirection = Vector3.up (vehicle moves up towards player).
/// </summary>
public class WrongSideVehicle : MonoBehaviour
{
    [Header("Vehicle Speed")]
    [Tooltip("Movement velocity towards the player (default 7, randomized 5-9)")]
    public float vehicleSpeed = 7f;

    [Header("Movement Direction")]
    [Tooltip("Vector3.down for vertical runner where oncoming traffic drives down screen")]
    public Vector3 moveDirection = Vector3.down;

    [Header("Audio / Visual Cues")]
    public GameObject dipperFlashLights; // Optional flashing headlight child object

    void Update()
    {
        // Vehicle moves directly towards the player
        transform.Translate(
            moveDirection.normalized *
            vehicleSpeed *
            Time.deltaTime
        );
    }

    private void OnTriggerEnter2D(Collider2D other)
    {
        // Collision check with Player
        if (other.CompareTag("Player"))
        {
            Debug.Log("WRONG SIDE VEHICLE HIT PLAYER!");

            // Call Game Over on your GameManager instance
            if (GameManager.Instance != null)
            {
                GameManager.Instance.GameOver();
            }

            Destroy(gameObject);
        }
    }
}`,
  },
  {
    fileName: 'WrongSideVehicleSpawner.cs',
    folder: 'Assets/Scripts/Traffic/',
    description: '3-Lane Wrong-Side Vehicle Spawner. Spawns oncoming vehicles randomly across Left (-2f), Center (0f), and Right (2f) lanes at spawnY = 8f with randomized speeds (5-9 m/s).',
    code: `using UnityEngine;

/// <summary>
/// Spawns wrong-side vehicles randomly across 3 lanes (Left, Center, Right)
/// at specified spawn interval and randomized speeds.
/// 
/// UNITY SETUP:
/// Road
/// ├── Left Lane   (X: -2.0)
/// ├── Center Lane (X:  0.0)
/// ├── Right Lane  (X:  2.0)
/// └── WrongSideVehicleSpawner
/// 
/// Vehicle Prefab:
/// - WrongSideVehicle.cs
/// - Collider2D (Is Trigger = true)
/// - Rigidbody2D (Body Type = Kinematic)
/// - Tag = "Vehicle"
/// 
/// Player:
/// - Tag = "Player"
/// - Collider2D
/// </summary>
public class WrongSideVehicleSpawner : MonoBehaviour
{
    [Header("Vehicle Prefabs")]
    [Tooltip("Assign scooter, auto-rickshaw, delivery bike, and car prefabs here")]
    public GameObject[] vehiclePrefabs;

    [Header("3 Lane X Positions")]
    public float leftLane = -2f;
    public float centerLane = 0f;
    public float rightLane = 2f;

    [Header("Spawn Settings")]
    public float spawnY = 8f;
    public float spawnInterval = 2f;

    private float timer;

    void Update()
    {
        timer += Time.deltaTime;

        if (timer >= spawnInterval)
        {
            SpawnVehicle();
            timer = 0f;
        }
    }

    void SpawnVehicle()
    {
        if (vehiclePrefabs == null || vehiclePrefabs.Length == 0)
            return;

        float[] lanes =
        {
            leftLane,
            centerLane,
            rightLane
        };

        // Pick random lane (0 = Left, 1 = Center, 2 = Right)
        int laneIndex = Random.Range(0, lanes.Length);

        // Pick random vehicle model (scooter, auto, car)
        int vehicleIndex = Random.Range(0, vehiclePrefabs.Length);

        Vector3 spawnPosition = new Vector3(
            lanes[laneIndex],
            spawnY,
            0f
        );

        GameObject vehicle = Instantiate(
            vehiclePrefabs[vehicleIndex],
            spawnPosition,
            Quaternion.identity
        );

        WrongSideVehicle wrongSide = vehicle.GetComponent<WrongSideVehicle>();

        if (wrongSide != null)
        {
            // Give each oncoming vehicle varied speed (5m/s to 9m/s)
            wrongSide.vehicleSpeed = Random.Range(5f, 9f);
        }
    }
}`,
  },
];

export const UnityProjectModal: React.FC<UnityProjectModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'scripts'>('guide');
  const [selectedScriptIndex, setSelectedScriptIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const selectedScript = UNITY_SCRIPTS[selectedScriptIndex];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    const fullText = UNITY_SCRIPTS.map(
      (s) => `// ==========================================\n// FILE: ${s.folder}${s.fileName}\n// DESCRIPTION: ${s.description}\n// ==========================================\n\n${s.code}\n\n`
    ).join('\n');

    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SchoolRunner_7_Rules_Stamina_Scripts.cs';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-3xl w-full max-h-[92vh] bg-slate-900 border border-slate-700 rounded-3xl text-white shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-700 border border-cyan-400 flex items-center justify-center text-xl font-bold shadow">
              ⚡
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>7 Core Game Rules & Exact Unity Scripts</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Rules 1 to 7 Active
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Default: 12 m/s • Potential: 2,160m (180s) • Min Speed: 4 m/s (≤20%) • 20% Vibrating • Hurdle Slowdown
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between px-4 pt-3 border-b border-slate-800 bg-slate-900/50">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('guide')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === 'guide'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              📖 The 7 Rules Breakdown & Setup
            </button>
            <button
              onClick={() => setActiveTab('scripts')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'scripts'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Ready-To-Paste Scripts ({UNITY_SCRIPTS.length})</span>
            </button>
          </div>

          <button
            onClick={handleDownloadAll}
            className="mb-2 py-1.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white flex items-center gap-1.5 shadow transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All Scripts (.cs)</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 text-xs text-slate-300 space-y-4">
          {activeTab === 'guide' ? (
            <div className="space-y-4 leading-relaxed">
              {/* 7 Rules Cards */}
              <div className="bg-cyan-950/40 border border-cyan-500/40 rounded-2xl p-4 text-slate-200 space-y-2">
                <div className="font-black text-cyan-300 flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>The 7 Game Rules In Detail:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <strong className="text-white text-xs block font-bold">1: Decide a Default Speed</strong>
                    <span className="text-slate-300">Set to <code className="text-cyan-300 font-mono">12 m/s</code> (43.2 km/h). This is the standard running velocity at full stamina.</span>
                  </div>

                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <strong className="text-white text-xs block font-bold">2: Calculate Distance in Mentioned Time</strong>
                    <span className="text-slate-300">Formula: <code className="text-amber-300 font-mono">12 m/s × 180s = 2,160 meters</code>. Target college is 1000m, leaving generous room for hurdle slowdowns.</span>
                  </div>

                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <strong className="text-white text-xs block font-bold">3: Default Stamina 100% = Default Speed</strong>
                    <span className="text-slate-300">When stamina is at 100/100, the speed multiplier is <code className="text-emerald-300 font-mono">1.0x</code> (<code className="text-cyan-300 font-mono">12 m/s</code>).</span>
                  </div>

                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <strong className="text-white text-xs block font-bold">4: Stamina Lowers Speed (Min = Default/3)</strong>
                    <span className="text-slate-300">Between 100% and 20%, speed drops smoothly down to <code className="text-cyan-300 font-mono">defaultSpeed / 3 = 4 m/s</code>. Below 20% (including 0), it stays locked at 4 m/s.</span>
                  </div>

                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <strong className="text-white text-xs block font-bold">5: Stamina Meter Vibrates at 20%</strong>
                    <span className="text-slate-300">At or below 20%, the stamina meter begins shaking/vibrating with a red warning alert and maintains that vibration until a drink pickup is collected!</span>
                  </div>

                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <strong className="text-white text-xs block font-bold">6: Hurdles Slows the Player</strong>
                    <span className="text-slate-300">Colliding with potholes, puddles, bumps, or barricades triggers a 2-second slowdown (<code className="text-amber-300 font-mono">0.55x</code> speed).</span>
                  </div>

                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 col-span-1 sm:col-span-2">
                    <strong className="text-white text-xs block font-bold">7: Time Keeps Running at Actual Speed</strong>
                    <span className="text-slate-300">When the player slows down (from low stamina or hurdles), only the player&apos;s physical speed drops; the countdown clock continues ticking at exact 1.0 real seconds per second (no time skips or dilation).</span>
                  </div>
                </div>
              </div>

              {/* Setup Steps */}
              <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4 space-y-2 text-xs">
                <h4 className="font-bold text-white text-sm">Unity Hierarchy & Inspector Setup:</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li><strong>_GameManager:</strong> Attach <code className="text-cyan-300 font-mono">StaminaSystem.cs</code>. Assign <code className="text-amber-300 font-mono">staminaSlider</code>, <code className="text-amber-300 font-mono">staminaText</code>, and <code className="text-amber-300 font-mono">staminaMeterContainer</code> (the RectTransform of your stamina card).</li>
                  <li><strong>Player:</strong> Attach <code className="text-amber-300 font-mono">PlayerMovement.cs</code>. Assign <code className="font-mono">joystick</code> and <code className="font-mono">staminaSystem</code>.</li>
                  <li><strong>Hurdle Prefabs:</strong> Attach <code className="text-amber-300 font-mono">HurdleObstacle.cs</code> to potholes, puddles, speed bumps, and barricades. Set Collider to &quot;Is Trigger&quot;.</li>
                  <li><strong>STAMINA Button:</strong> Attach <code className="text-emerald-300 font-mono">StaminaBoostButton.cs</code> to hold-to-boost.</li>
                  <li><strong>Drinks:</strong> Attach <code className="text-amber-300 font-mono">DrinkPickup.cs</code> to drink prefabs.</li>
                  <li><strong>Main Camera:</strong> Attach <code className="text-cyan-300 font-mono">CameraFollow.cs</code>. Assign Player Transform to <code className="font-mono">target</code>.</li>
                  <li><strong>Wrong-Side Spawner:</strong> Attach <code className="text-red-300 font-mono">WrongSideVehicleSpawner.cs</code>. Assign vehicle prefabs and set Left/Center/Right lanes (-2, 0, 2).</li>
                  <li><strong>Vehicle Prefabs:</strong> Attach <code className="text-amber-300 font-mono">WrongSideVehicle.cs</code>, <code className="font-mono">Collider2D</code> (Trigger), <code className="font-mono">Rigidbody2D</code> (Kinematic), and Tag as <code className="font-mono">&quot;Vehicle&quot;</code>.</li>
                </ul>
              </div>

              {/* Wrong-Side Vehicle Setup Card */}
              <div className="bg-gradient-to-r from-red-950/60 to-amber-950/60 border border-red-500/40 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-red-300 text-sm">
                  <span className="text-base">⚠️</span>
                  <span>Wrong-Side Indian Traffic Hazard Setup (WrongSideVehicle.cs & Spawner):</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5">
                    <strong className="text-amber-300 block font-bold">1. Unity Hierarchy Tree</strong>
                    <pre className="font-mono text-[11px] text-slate-300 leading-snug">
{`Road
├── Left Lane   (X = -2.0)
├── Center Lane (X =  0.0)
├── Right Lane  (X =  2.0)
└── WrongSideVehicleSpawner
    ├── spawnY = 8.0
    └── spawnInterval = 2.0s`}
                    </pre>
                  </div>

                  <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5">
                    <strong className="text-red-300 block font-bold">2. Component & Tag Settings</strong>
                    <div className="font-mono text-[11px] text-slate-300 space-y-1">
                      <div>Vehicle Prefab: <span className="text-cyan-300">WrongSideVehicle.cs</span></div>
                      <div>Tag: <span className="text-amber-400">&quot;Vehicle&quot;</span></div>
                      <div>Collider: <span className="text-emerald-400">Collider2D (Is Trigger = true)</span></div>
                      <div>Physics: <span className="text-emerald-400">Rigidbody2D (Kinematic)</span></div>
                      <div>Player Tag: <span className="text-amber-400">&quot;Player&quot;</span></div>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  🚦 <strong>Direction Note:</strong> For vertical runners where player moves forward/up the road, set <code className="text-cyan-300 font-mono">moveDirection = Vector3.down</code> so oncoming wrong-side scooters/autos hurtle downwards towards the player! If road is bottom-up, use <code className="text-cyan-300 font-mono">Vector3.up</code>.
                </p>
              </div>

              {/* Wide Camera Inspector Setup Card */}
              <div className="bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/40 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-blue-300 text-sm">
                  <Video className="w-4 h-4 text-blue-400" />
                  <span>Wide Camera Inspector Settings (Mobile Portrait):</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                    <strong className="text-cyan-300 block font-bold">Orthographic Camera (Recommended)</strong>
                    <div className="font-mono text-[11px] text-slate-300 space-y-0.5">
                      <div>Projection: <span className="text-emerald-400">Orthographic</span></div>
                      <div>Size: <span className="text-amber-400">7.0</span> (Range: 6.5 – 8.0)</div>
                      <div>Position: <span className="text-cyan-300">(0, 8.5, -6.5)</span></div>
                      <div>Rotation: <span className="text-cyan-300">(50, 0, 0)</span></div>
                      <div>Smooth Time X: <span className="text-amber-400">0.15s</span></div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                    <strong className="text-indigo-300 block font-bold">Perspective Camera (Alternative)</strong>
                    <div className="font-mono text-[11px] text-slate-300 space-y-0.5">
                      <div>Projection: <span className="text-emerald-400">Perspective</span></div>
                      <div>Field of View (FOV): <span className="text-amber-400">58° – 62°</span></div>
                      <div>Position: <span className="text-indigo-300">(0, 7.8, -7.2)</span></div>
                      <div>Rotation: <span className="text-indigo-300">(46, 0, 0)</span></div>
                      <div>Near / Far Clip: <span className="text-amber-400">0.3 / 100</span></div>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  ⚡ <strong>Why this framing works:</strong> Road occupies ~54% of screen width with 80+ px per lane. The player stays comfortably in the lower-middle zone (~73% down), giving the player ~70% forward lookahead reaction time to dodge oncoming vehicles and hurdles!
                </p>
              </div>
            </div>
          ) : (
            /* Scripts Tab */
            <div className="flex flex-col sm:flex-row gap-4 h-full">
              {/* Script List Sidebar */}
              <div className="sm:w-56 shrink-0 flex flex-row sm:flex-col gap-1 overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0">
                {UNITY_SCRIPTS.map((script, idx) => (
                  <button
                    key={script.fileName}
                    onClick={() => setSelectedScriptIndex(idx)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all cursor-pointer ${
                      selectedScriptIndex === idx
                        ? 'bg-cyan-600/30 border border-cyan-500/50 text-white font-bold'
                        : 'bg-slate-800/40 border border-transparent text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <FileCode className="w-4 h-4 shrink-0 text-cyan-400" />
                    <span className="truncate">{script.fileName}</span>
                  </button>
                ))}
              </div>

              {/* Code Viewer */}
              <div className="flex-1 flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-b border-slate-800 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-300 font-mono">
                    <Folder className="w-3.5 h-3.5 text-amber-400" />
                    <span>{selectedScript.folder}</span>
                    <span className="font-bold text-white">{selectedScript.fileName}</span>
                  </div>

                  <button
                    onClick={() => handleCopy(selectedScript.code)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy C# Code'}</span>
                  </button>
                </div>

                <div className="p-2 text-[11px] text-slate-400 bg-slate-900/40 border-b border-slate-800">
                  {selectedScript.description}
                </div>

                <pre className="p-3 overflow-auto text-[11px] font-mono text-emerald-300/90 leading-relaxed max-h-[380px] select-text">
                  <code>{selectedScript.code}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
