from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from derivacion.derivacion_2puntos import ctr_derivacion_2puntos
from integracion.gaussiana import ctr_gaussiana
from integracion.trapecio import ctr_trapecio
from interpolacion.diferiencias_divididas import init_dif_divididas
from interpolacion.Igualmente_esp import ctr_igualmente_espaciados
from interpolacion.lagrange import lagrange_method
from interpolacion.neville import ctr_neville
from interpolacion.splines_cubicos import ctr_splines
from modelos import (
    BisexionModel,
    DeflacionModel,
    Derivacion2PuntosModel,
    DiferenciasDivididasModel,
    FakePositionModel,
    FloatNumberModel,
    GaussianaModel,
    HornerModel,
    IgualmenteEspaciadosModel,
    LagrangeModel,
    MullerModel,
    NevilleModel,
    NewthonRaphsonModel,
    PuntoFijoModel,
    SecanteModel,
    SteffencenModel,
    TrapecioModel,
    SplinesModel
)
from raices.bisexion import biseccion
from raices.deflacion import ctr_deflacion
from raices.falsa_posicion import fake_position_metod
from raices.float_to_bin import float_to_bin
from raices.horner import horner_method
from raices.muller import muller_method
from raices.newthon_raphson import newton_raphson
from raices.punto_fijo import pf_method
from raices.secante import sec_method
from raices.steffensen import ctr_Steff

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/float_number")
def float_number_representation(data: FloatNumberModel):
    return float_to_bin(data)

@app.post("/biseccion")
def calcular_Bisexion(data: BisexionModel):
    return biseccion(data)

@app.post("/secante")
def calcular_secante(data: SecanteModel):
    return sec_method(data)

@app.post("/newton_raphson")
def calcular_newton_raphson(data: NewthonRaphsonModel):
    return newton_raphson(data)

@app.post("/punto_fijo")
def calcular_punto_fijo(data: PuntoFijoModel):
    return pf_method(data)

@app.post("/fake_position")
def calcular_fake_position(data: FakePositionModel):
    return fake_position_metod(data)

@app.post("/steffensen")
def calcular_Steffensen(data: SteffencenModel):
    return ctr_Steff(data)

@app.post("/muller")
def calcular_Muller(data: MullerModel):
    return muller_method(data)

@app.post("/horner")
def calcular_Horner(data: HornerModel):
    return horner_method(data)

@app.post("/deflacion")
def calcular_Deflacion(data: DeflacionModel):
    return ctr_deflacion(data)

@app.post("/lagrange")
def calcular_lagrange(data: LagrangeModel):
    return lagrange_method(data)

@app.post("/neville")
def calcular_neville(data: NevilleModel):
    return ctr_neville(data)

@app.post("/diferencias_divididas")
def calcular_diferencias_divididas(data: DiferenciasDivididasModel):
    return init_dif_divididas(data)

@app.post("/igualmente_espaciados")
def calcular_igualmente_espaciados(data: IgualmenteEspaciadosModel):
    return ctr_igualmente_espaciados(data)

@app.post("/derivacion_2puntos")
def calcular_derivacion_2puntos(data: Derivacion2PuntosModel):
    return ctr_derivacion_2puntos(data)

@app.post("/trapecio")
def calcular_trapecio(data: TrapecioModel):
    return ctr_trapecio(data)

@app.post("/gaussiana")
def calcular_gaussiana(data: GaussianaModel):
    return ctr_gaussiana(data)

@app.post("/splines")
def splines_cubicos(data:SplinesModel):
    return ctr_splines(data)