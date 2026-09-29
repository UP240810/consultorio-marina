"""
Genera 500 frases motivadoras distintas (en español) dirigidas a la psicóloga
que inicia sesión cada día. Combina dos bancos de fragmentos (20 x 25 = 500
combinaciones únicas) para asegurar variedad real y evitar frases genéricas
repetidas. Guarda el resultado en src/lib/quotes.json.

Uso: python3 scripts/generate_quotes.py
"""
import json
import os

BANCO_A = [
    "Cada sesión que acompañas deja una huella",
    "Detrás de cada cita agendada hay una persona que decidió pedir ayuda",
    "Tu escucha de hoy puede ser el punto de partida de alguien",
    "El trabajo silencioso de esta semana",
    "Cada avance, por pequeño que parezca",
    "La paciencia que sostienes en consulta",
    "Cada paciente que cruza esa puerta",
    "El espacio seguro que construyes en cada sesión",
    "Sostener el proceso de alguien más, sin prisa",
    "Cada nota que escribes después de una sesión",
    "El criterio profesional que afinas con los años",
    "Cada vez que eliges la calma antes que la prisa",
    "Acompañar sin apurar el proceso de nadie",
    "El vínculo de confianza que se construye cita a cita",
    "Cada decisión clínica que tomas con cuidado",
    "La energía que dedicas a entender antes que a responder",
    "Cada persona que se siente escuchada aquí",
    "El descanso también es parte del cuidado que ofreces",
    "Cada progreso documentado en un expediente",
    "Tu constancia, más que tu perfección",
]

BANCO_B = [
    "importa más de lo que alcanzas a ver hoy",
    "es el trabajo que sostiene todo lo demás",
    "vale la pena, aunque el cambio tarde en notarse",
    "es una forma silenciosa de cuidado",
    "merece reconocerse, aunque nadie más lo note",
    "construye algo que no se mide en una sola cita",
    "es parte de un proceso más grande que un solo día",
    "es la base de una terapia que sí transforma",
    "requiere presencia, y tú la ofreces",
    "es un acto de responsabilidad y respeto",
    "no necesita ser perfecto para ser valioso",
    "se sostiene con cada pequeño hábito profesional",
    "también merece un momento de pausa",
    "es un paso más en un camino que no siempre es lineal",
    "habla de un compromiso genuino con quienes atiendes",
    "deja espacio para que la otra persona avance a su ritmo",
    "es la razón por la que este consultorio existe",
    "no se logra sola, y está bien pedir apoyo también",
    "se nota en la confianza que te tienen tus pacientes",
    "es trabajo que merece organización y también descanso",
    "suma, aunque hoy el avance parezca mínimo",
    "es parte de acompañar procesos humanos reales",
    "te recuerda por qué elegiste esta profesión",
    "está permitido hacerlo con calma, un caso a la vez",
    "es cuidado, tanto para quien lo recibe como para quien lo ofrece",
]

def main():
    quotes = []
    for a in BANCO_A:
        for b in BANCO_B:
            quotes.append(f"{a}, {b}.")
    assert len(quotes) == len(set(quotes)), "Hay frases duplicadas"
    assert len(quotes) == 500, f"Se esperaban 500 frases, se generaron {len(quotes)}"

    out_path = os.path.join(os.path.dirname(__file__), "..", "src", "lib", "quotes.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(quotes, f, ensure_ascii=False, indent=2)
    print(f"{len(quotes)} frases guardadas en {out_path}")

if __name__ == "__main__":
    main()
