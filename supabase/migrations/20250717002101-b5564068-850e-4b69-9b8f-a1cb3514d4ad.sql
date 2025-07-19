-- Expandir dados de exercícios do CrossFit com base no site oficial
-- Primeiro, vamos limpar exercícios básicos e adicionar os completos

DELETE FROM public.crossfit_exercises;

-- Inserir os nove movimentos fundamentais do CrossFit
INSERT INTO public.crossfit_exercises (name, category, movement_pattern, equipment_needed, description) VALUES
-- The Squats
('Air Squat', 'gymnastics', 'squat', '{}', 'Agachamento livre sem peso - movimento fundamental'),
('Front Squat', 'strength', 'squat', '{barbell, rack}', 'Agachamento frontal com barra'),
('Overhead Squat', 'strength', 'squat', '{barbell}', 'Agachamento com barra sobre a cabeça'),

-- The Presses  
('Shoulder Press', 'strength', 'push', '{barbell}', 'Desenvolvimento militar'),
('Push Press', 'strength', 'push', '{barbell}', 'Desenvolvimento com impulso das pernas'),
('Push Jerk', 'strength', 'push', '{barbell}', 'Arremesso com recepção em agachamento'),

-- The Deadlifts
('Deadlift', 'strength', 'hinge', '{barbell, plates}', 'Levantamento terra'),
('Sumo Deadlift High Pull', 'metcon', 'hinge', '{barbell, plates}', 'Terra sumo com puxada alta'),
('Medicine Ball Clean', 'metcon', 'squat', '{medicine ball}', 'Clean com medicine ball');

-- Inserir movimentos adicionais em ordem alfabética
INSERT INTO public.crossfit_exercises (name, category, movement_pattern, equipment_needed, description) VALUES
-- A
('AbMat Sit-up', 'gymnastics', 'core', '{abmat}', 'Abdominal com AbMat'),

-- B
('Back Scale', 'gymnastics', 'balance', '{}', 'Escala dorsal'),
('Back Squat', 'strength', 'squat', '{barbell, rack, plates}', 'Agachamento com barra nas costas'),
('Barbell Front-rack Lunge', 'strength', 'lunge', '{barbell}', 'Afundo com barra na frente'),
('Bench Press', 'strength', 'push', '{barbell, bench}', 'Supino'),
('Box Jump', 'metcon', 'jump', '{box}', 'Salto na caixa'),
('Box Step-up', 'metcon', 'step', '{box}', 'Subida na caixa'),
('Burpee', 'metcon', 'full body', '{}', 'Movimento completo: agachamento, prancha, salto'),
('Burpee Box Jump-over', 'metcon', 'full body', '{box}', 'Burpee com salto sobre a caixa'),
('Butterfly Pull-up', 'gymnastics', 'pull', '{pull-up bar}', 'Barra fixa butterfly'),

-- C
('Chest-to-wall Handstand Push-up', 'gymnastics', 'push', '{wall}', 'Flexão de parada de mão na parede'),
('Clean', 'strength', 'pull', '{barbell, plates}', 'Clean olímpico'),
('Clean and Jerk', 'strength', 'combined', '{barbell, plates}', 'Clean e arremesso'),
('Clean and Push Jerk', 'strength', 'combined', '{barbell, plates}', 'Clean e push jerk'),

-- D
('Dip', 'gymnastics', 'push', '{rings, parallettes}', 'Paralelas'),
('Double-under', 'cardio', 'jump', '{jump rope}', 'Pular corda com dupla passada'),
('Dumbbell Clean', 'strength', 'pull', '{dumbbell}', 'Clean com halter'),
('Dumbbell Deadlift', 'strength', 'hinge', '{dumbbell}', 'Terra com halter'),
('Dumbbell Farmers Carry', 'strength', 'carry', '{dumbbell}', 'Caminhada do fazendeiro'),
('Dumbbell Front-rack Lunge', 'strength', 'lunge', '{dumbbell}', 'Afundo com halter na frente'),
('Dumbbell Front Squat', 'strength', 'squat', '{dumbbell}', 'Agachamento frontal com halter'),
('Dumbbell Hang Clean', 'strength', 'pull', '{dumbbell}', 'Hang clean com halter'),
('Dumbbell Hang Power Clean', 'strength', 'pull', '{dumbbell}', 'Hang power clean com halter'),
('Dumbbell Overhead Squat', 'strength', 'squat', '{dumbbell}', 'Agachamento overhead com halter'),
('Dumbbell Overhead Walking Lunge', 'strength', 'lunge', '{dumbbell}', 'Afundo overhead com halter'),
('Dumbbell Power Clean', 'strength', 'pull', '{dumbbell}', 'Power clean com halter'),
('Dumbbell Power Snatch', 'strength', 'pull', '{dumbbell}', 'Power snatch com halter'),
('Dumbbell Push Jerk', 'strength', 'push', '{dumbbell}', 'Push jerk com halter'),
('Dumbbell Push Press', 'strength', 'push', '{dumbbell}', 'Push press com halter'),
('Dumbbell Squat Snatch', 'strength', 'pull', '{dumbbell}', 'Snatch com halter'),
('Dumbbell Thruster', 'metcon', 'squat', '{dumbbell}', 'Thruster com halter'),
('Dumbbell Turkish Get-up', 'strength', 'core', '{dumbbell}', 'Turkish get-up com halter'),

-- F
('Forward Roll From Support', 'gymnastics', 'roll', '{}', 'Rolamento para frente'),
('Freestanding Handstand Push-up', 'gymnastics', 'push', '{}', 'Flexão de parada de mão livre'),
('Front Scale', 'gymnastics', 'balance', '{}', 'Escala frontal'),

-- G
('GHD Back Extension', 'gymnastics', 'hinge', '{ghd}', 'Extensão dorsal no GHD'),
('GHD Hip and Back Extension', 'gymnastics', 'hinge', '{ghd}', 'Extensão de quadril e dorsal no GHD'),
('GHD Hip Extension', 'gymnastics', 'hinge', '{ghd}', 'Extensão de quadril no GHD'),
('GHD Sit-up', 'gymnastics', 'core', '{ghd}', 'Abdominal no GHD'),
('Glide Kip', 'gymnastics', 'kip', '{pull-up bar}', 'Kip deslizante'),
('Good Morning', 'strength', 'hinge', '{barbell}', 'Bom dia'),

-- H
('Handstand', 'gymnastics', 'balance', '{}', 'Parada de mão'),
('Handstand Pirouette', 'gymnastics', 'balance', '{}', 'Pirueta na parada de mão'),
('Handstand Push-up', 'gymnastics', 'push', '{wall}', 'Flexão de parada de mão'),
('Handstand Walk', 'gymnastics', 'balance', '{}', 'Caminhada na parada de mão'),
('Hang Clean', 'strength', 'pull', '{barbell, plates}', 'Hang clean'),
('Hang Clean and Push Jerk', 'strength', 'combined', '{barbell, plates}', 'Hang clean e push jerk'),
('Hanging L-sit', 'gymnastics', 'core', '{pull-up bar}', 'L-sit suspenso'),
('Hang Power Clean', 'strength', 'pull', '{barbell, plates}', 'Hang power clean'),
('Hang Power Snatch', 'strength', 'pull', '{barbell, plates}', 'Hang power snatch'),
('Hang Snatch', 'strength', 'pull', '{barbell, plates}', 'Hang snatch'),

-- I
('Inverted Burpee', 'metcon', 'full body', '{}', 'Burpee invertido'),

-- K
('Kettlebell Snatch', 'strength', 'pull', '{kettlebell}', 'Snatch com kettlebell'),
('Kettlebell Swing', 'metcon', 'hinge', '{kettlebell}', 'Balanço com kettlebell'),
('Kipping Bar Muscle-up', 'gymnastics', 'pull', '{pull-up bar}', 'Muscle-up na barra com kip'),
('Kipping Chest-to-bar Pull-up', 'gymnastics', 'pull', '{pull-up bar}', 'Barra fixa peito-barra com kip'),
('Kipping Deficit Handstand Push-up', 'gymnastics', 'push', '{plates, wall}', 'Flexão de parada de mão deficit com kip'),
('Kipping Handstand Push-up', 'gymnastics', 'push', '{wall}', 'Flexão de parada de mão com kip'),
('Kipping Muscle-up', 'gymnastics', 'pull', '{rings}', 'Muscle-up nas argolas com kip'),
('Kipping Pull-up', 'gymnastics', 'pull', '{pull-up bar}', 'Barra fixa com kip'),
('Kipping Toes-to-bar', 'gymnastics', 'core', '{pull-up bar}', 'Pés na barra com kip'),

-- L
('Legless Rope Climb', 'gymnastics', 'pull', '{rope}', 'Subida na corda sem pernas'),
('L Pull-up', 'gymnastics', 'pull', '{pull-up bar}', 'Barra fixa em L'),
('L-sit', 'gymnastics', 'core', '{parallettes}', 'L-sit'),
('L-sit on Rings', 'gymnastics', 'core', '{rings}', 'L-sit nas argolas'),
('L-sit Rope Climb', 'gymnastics', 'pull', '{rope}', 'Subida na corda em L'),
('L-sit to Shoulder Stand', 'gymnastics', 'core', '{rings}', 'L-sit para apoio de ombros'),

-- M
('Modified Rope Climb', 'gymnastics', 'pull', '{rope}', 'Subida na corda modificada'),
('Muscle Snatch', 'strength', 'pull', '{barbell, plates}', 'Muscle snatch'),

-- P
('Power Clean', 'strength', 'pull', '{barbell, plates}', 'Power clean'),
('Power Clean and Split Jerk', 'strength', 'combined', '{barbell, plates}', 'Power clean e split jerk'),
('Power Snatch', 'strength', 'pull', '{barbell, plates}', 'Power snatch'),
('Pull-over', 'gymnastics', 'pull', '{pull-up bar}', 'Saída de força'),
('Pull-up', 'gymnastics', 'pull', '{pull-up bar}', 'Barra fixa'),
('Push-up', 'gymnastics', 'push', '{}', 'Flexão de braço'),

-- R
('Ring Dip', 'gymnastics', 'push', '{rings}', 'Paralelas nas argolas'),
('Ring Push-up', 'gymnastics', 'push', '{rings}', 'Flexão nas argolas'),
('Ring Row', 'gymnastics', 'pull', '{rings}', 'Remada nas argolas'),
('Rope Climb', 'gymnastics', 'pull', '{rope}', 'Subida na corda'),
('Row', 'cardio', 'pull', '{rowing machine}', 'Remada no ergômetro'),

-- S
('Shoot-through', 'gymnastics', 'transition', '{rings, parallettes}', 'Passagem por baixo'),
('Single-leg Squat (Pistol)', 'gymnastics', 'squat', '{}', 'Agachamento unilateral (pistol)'),
('Single-under', 'cardio', 'jump', '{jump rope}', 'Pular corda simples'),
('Skin the Cat', 'gymnastics', 'flexibility', '{rings}', 'Descascar o gato'),
('Slam Ball', 'metcon', 'throw', '{slam ball}', 'Arremesso de slam ball'),
('Snatch', 'strength', 'pull', '{barbell, plates}', 'Snatch olímpico'),
('Snatch Balance', 'strength', 'balance', '{barbell, plates}', 'Snatch balance'),
('Sots Press', 'strength', 'push', '{barbell}', 'Sots press'),
('Split Clean', 'strength', 'pull', '{barbell, plates}', 'Clean em split'),
('Split Jerk', 'strength', 'push', '{barbell, plates}', 'Split jerk'),
('Split Snatch', 'strength', 'pull', '{barbell, plates}', 'Split snatch'),
('Straddle Press to Handstand', 'gymnastics', 'push', '{}', 'Straddle press para parada de mão'),
('Strict Bar Muscle-up', 'gymnastics', 'pull', '{pull-up bar}', 'Muscle-up strict na barra'),
('Strict Chest-to-bar Pull-up', 'gymnastics', 'pull', '{pull-up bar}', 'Barra fixa peito-barra strict'),
('Strict Handstand Push-up', 'gymnastics', 'push', '{wall}', 'Flexão de parada de mão strict'),
('Strict Knees-to-elbows', 'gymnastics', 'core', '{pull-up bar}', 'Joelhos no cotovelo strict'),
('Strict Muscle-up', 'gymnastics', 'pull', '{rings}', 'Muscle-up strict'),
('Strict Pull-up', 'gymnastics', 'pull', '{pull-up bar}', 'Barra fixa strict'),
('Strict Toes-to-bar', 'gymnastics', 'core', '{pull-up bar}', 'Pés na barra strict'),
('Strict Toes-to-rings', 'gymnastics', 'core', '{rings}', 'Pés nas argolas strict'),
('Sumo Deadlift', 'strength', 'hinge', '{barbell, plates}', 'Terra sumo'),

-- T
('Thruster', 'metcon', 'squat', '{barbell, plates}', 'Agachamento frontal + desenvolvimento'),
('Toes-to-bar', 'gymnastics', 'core', '{pull-up bar}', 'Elevação de pernas até a barra'),

-- W
('Walking Lunge', 'strength', 'lunge', '{}', 'Afundo caminhando'),
('Wall Ball', 'metcon', 'squat', '{medicine ball, target}', 'Arremesso de medicine ball'),
('Wall Walk', 'gymnastics', 'push', '{wall}', 'Caminhada na parede'),
('Windshield Wiper', 'gymnastics', 'core', '{pull-up bar}', 'Limpador de para-brisa'),

-- Z
('Zercher Squat', 'strength', 'squat', '{barbell}', 'Agachamento Zercher');

-- Criar tabela para Hero Workouts
CREATE TABLE IF NOT EXISTS public.hero_workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  workout_structure JSONB NOT NULL,
  story TEXT,
  scaling_options JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela de Hero Workouts
ALTER TABLE public.hero_workouts ENABLE ROW LEVEL SECURITY;

-- Política para permitir visualização dos hero workouts por todos usuários autenticados
CREATE POLICY "Authenticated users can view hero workouts" 
ON public.hero_workouts 
FOR SELECT 
USING (true);

-- Apenas professores podem gerenciar hero workouts
CREATE POLICY "Professors can manage hero workouts" 
ON public.hero_workouts 
FOR ALL 
USING (get_current_user_role() = 'professor');

-- Inserir Hero Workouts famosos
INSERT INTO public.hero_workouts (name, description, workout_structure, story) VALUES
('Murph', 'For time: 1-mile run, 100 pull-ups, 200 push-ups, 300 squats, 1-mile run', 
'{
  "type": "for_time",
  "rounds": 1,
  "exercises": [
    {"name": "Run", "distance": "1 mile"},
    {"name": "Pull-up", "reps": 100},
    {"name": "Push-up", "reps": 200},
    {"name": "Air Squat", "reps": 300},
    {"name": "Run", "distance": "1 mile"}
  ],
  "notes": "Partition the pull-ups, push-ups, and squats as needed. If you have a 20-lb vest or body armor, wear it."
}',
'Em memória do Tenente da Marinha Michael Murphy, 29 anos, de Patchogue, N.Y., que foi morto no Afeganistão em 28 de junho de 2005.'),

('JT', '21-15-9 reps for time of: Handstand push-ups, Ring dips, Push-ups',
'{
  "type": "for_time",
  "scheme": "21-15-9",
  "exercises": [
    {"name": "Handstand Push-up"},
    {"name": "Ring Dip"},
    {"name": "Push-up"}
  ]
}',
'Em honra ao Suboficial de 1ª Classe Jeff Taylor, 30 anos, de Midway, West Virginia, que foi morto em 28 de junho de 2005.'),

('DT', '5 rounds for time of: 12 deadlifts, 9 hang power cleans, 6 push jerks',
'{
  "type": "for_time",
  "rounds": 5,
  "exercises": [
    {"name": "Deadlift", "reps": 12, "weight": "155/105 lb"},
    {"name": "Hang Power Clean", "reps": 9, "weight": "155/105 lb"},
    {"name": "Push Jerk", "reps": 6, "weight": "155/105 lb"}
  ]
}',
'Em honra ao Sargento da Força Aérea Timothy P. Davis, 28 anos, que foi morto em 20 de fevereiro de 2009.'),

('Nate', 'Complete as many rounds as possible in 20 minutes of: 2 muscle-ups, 4 handstand push-ups, 8 kettlebell swings',
'{
  "type": "amrap",
  "time_cap": 20,
  "exercises": [
    {"name": "Muscle-up", "reps": 2},
    {"name": "Handstand Push-up", "reps": 4},
    {"name": "Kettlebell Swing", "reps": 8, "weight": "70/53 lb"}
  ]
}',
'Em honra ao Chefe de Operações Especiais da Marinha (SEAL) Nate Hardy, que foi morto em 4 de fevereiro de 2008.'),

('Randy', 'For time: 75 power snatches',
'{
  "type": "for_time",
  "rounds": 1,
  "exercises": [
    {"name": "Power Snatch", "reps": 75, "weight": "75/55 lb"}
  ]
}',
'Em honra a Randy Simmons, 51 anos, veterano de 27 anos da LAPD e membro da equipe SWAT.'),

('Daniel', 'For time: 50 pull-ups, 400m run, 21 thrusters, 800m run, 21 thrusters, 400m run, 50 pull-ups',
'{
  "type": "for_time",
  "rounds": 1,
  "exercises": [
    {"name": "Pull-up", "reps": 50},
    {"name": "Run", "distance": "400m"},
    {"name": "Thruster", "reps": 21, "weight": "95/65 lb"},
    {"name": "Run", "distance": "800m"},
    {"name": "Thruster", "reps": 21, "weight": "95/65 lb"},
    {"name": "Run", "distance": "400m"},
    {"name": "Pull-up", "reps": 50}
  ]
}',
'Dedicado ao Sargento de 1ª Classe do Exército Daniel Crabtree que foi morto em Al Kut, Iraque.'),

('Josh', 'For time: 21 overhead squats, 42 pull-ups, 15 overhead squats, 30 pull-ups, 9 overhead squats, 18 pull-ups',
'{
  "type": "for_time",
  "rounds": 1,
  "exercises": [
    {"name": "Overhead Squat", "reps": 21, "weight": "95/65 lb"},
    {"name": "Pull-up", "reps": 42},
    {"name": "Overhead Squat", "reps": 15, "weight": "95/65 lb"},
    {"name": "Pull-up", "reps": 30},
    {"name": "Overhead Squat", "reps": 9, "weight": "95/65 lb"},
    {"name": "Pull-up", "reps": 18}
  ]
}',
'Sargento do Exército dos EUA Joshua Hager, 29 anos, de Broomfield, Colorado.'),

('Jason', 'For time: 100 squats, 5 muscle-ups, 75 squats, 10 muscle-ups, 50 squats, 15 muscle-ups, 25 squats, 20 muscle-ups',
'{
  "type": "for_time",
  "rounds": 1,
  "exercises": [
    {"name": "Air Squat", "reps": 100},
    {"name": "Muscle-up", "reps": 5},
    {"name": "Air Squat", "reps": 75},
    {"name": "Muscle-up", "reps": 10},
    {"name": "Air Squat", "reps": 50},
    {"name": "Muscle-up", "reps": 15},
    {"name": "Air Squat", "reps": 25},
    {"name": "Muscle-up", "reps": 20}
  ]
}',
'S01 (SEAL) Jason Dale Lewis foi morto por um IED em Bagdá em 6 de julho de 2007.'),

('Badger', '3 rounds for time of: 30 squat cleans, 30 pull-ups, Run 800 meters',
'{
  "type": "for_time",
  "rounds": 3,
  "exercises": [
    {"name": "Squat Clean", "reps": 30, "weight": "95/65 lb"},
    {"name": "Pull-up", "reps": 30},
    {"name": "Run", "distance": "800m"}
  ]
}',
'Em honra ao Suboficial-Chefe da Marinha Mark Carter, 27 anos, de Fallbrook, Califórnia.'),

('Hansen', '5 rounds for time of: 30 kettlebell swings, 30 burpees, 30 GHD sit-ups',
'{
  "type": "for_time",
  "rounds": 5,
  "exercises": [
    {"name": "Kettlebell Swing", "reps": 30, "weight": "70/53 lb"},
    {"name": "Burpee", "reps": 30},
    {"name": "GHD Sit-up", "reps": 30}
  ]
}',
'Sargento do Corpo de Fuzileiros Navais Daniel Hansen morreu em 14 de fevereiro de 2009.');

-- Criar tabela para Famous Workouts (Benchmark WODs)
CREATE TABLE IF NOT EXISTS public.benchmark_workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'girls', 'games', 'open', 'regionals'
  description TEXT NOT NULL,
  workout_structure JSONB NOT NULL,
  scaling_options JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela de Benchmark Workouts
ALTER TABLE public.benchmark_workouts ENABLE ROW LEVEL SECURITY;

-- Política para permitir visualização dos benchmark workouts por todos usuários autenticados
CREATE POLICY "Authenticated users can view benchmark workouts" 
ON public.benchmark_workouts 
FOR SELECT 
USING (true);

-- Apenas professores podem gerenciar benchmark workouts
CREATE POLICY "Professors can manage benchmark workouts" 
ON public.benchmark_workouts 
FOR ALL 
USING (get_current_user_role() = 'professor');

-- Inserir os famosos "Girls" (Benchmark Workouts)
INSERT INTO public.benchmark_workouts (name, category, description, workout_structure) VALUES
('Fran', 'girls', '21-15-9 reps, for time of: Thrusters, Pull-ups',
'{
  "type": "for_time",
  "scheme": "21-15-9",
  "exercises": [
    {"name": "Thruster", "weight": "95/65 lb"},
    {"name": "Pull-up"}
  ]
}'),

('Grace', 'girls', 'For time: 30 clean and jerks',
'{
  "type": "for_time",
  "rounds": 1,
  "exercises": [
    {"name": "Clean and Jerk", "reps": 30, "weight": "135/95 lb"}
  ]
}'),

('Diane', 'girls', '21-15-9 reps, for time of: Deadlifts, Handstand push-ups',
'{
  "type": "for_time",
  "scheme": "21-15-9",
  "exercises": [
    {"name": "Deadlift", "weight": "225/155 lb"},
    {"name": "Handstand Push-up"}
  ]
}'),

('Helen', 'girls', '3 rounds for time of: Run 400 meters, 21 kettlebell swings, 12 pull-ups',
'{
  "type": "for_time",
  "rounds": 3,
  "exercises": [
    {"name": "Run", "distance": "400m"},
    {"name": "Kettlebell Swing", "reps": 21, "weight": "53/35 lb"},
    {"name": "Pull-up", "reps": 12}
  ]
}'),

('Cindy', 'girls', 'Complete as many rounds as possible in 20 minutes of: 5 pull-ups, 10 push-ups, 15 squats',
'{
  "type": "amrap",
  "time_cap": 20,
  "exercises": [
    {"name": "Pull-up", "reps": 5},
    {"name": "Push-up", "reps": 10},
    {"name": "Air Squat", "reps": 15}
  ]
}'),

('Annie', 'girls', '50-40-30-20-10 reps for time of: Double-unders, Sit-ups',
'{
  "type": "for_time",
  "scheme": "50-40-30-20-10",
  "exercises": [
    {"name": "Double-under"},
    {"name": "AbMat Sit-up"}
  ]
}'),

('Elizabeth', 'girls', '21-15-9 reps, for time of: Cleans, Ring dips',
'{
  "type": "for_time",
  "scheme": "21-15-9",
  "exercises": [
    {"name": "Clean", "weight": "135/95 lb"},
    {"name": "Ring Dip"}
  ]
}'),

('Kelly', 'girls', '5 rounds for time of: Run 400 meters, 30 box jumps, 30 wall-ball shots',
'{
  "type": "for_time",
  "rounds": 5,
  "exercises": [
    {"name": "Run", "distance": "400m"},
    {"name": "Box Jump", "reps": 30, "height": "24/20 inches"},
    {"name": "Wall Ball", "reps": 30, "weight": "20/14 lb"}
  ]
}'),

('Karen', 'girls', 'For time: 150 wall-ball shots',
'{
  "type": "for_time",
  "rounds": 1,
  "exercises": [
    {"name": "Wall Ball", "reps": 150, "weight": "20/14 lb"}
  ]
}'),

('Nancy', 'girls', '5 rounds for time of: Run 400 meters, 15 overhead squats',
'{
  "type": "for_time",
  "rounds": 5,
  "exercises": [
    {"name": "Run", "distance": "400m"},
    {"name": "Overhead Squat", "reps": 15, "weight": "95/65 lb"}
  ]
}');