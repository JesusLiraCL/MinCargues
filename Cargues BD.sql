--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-05-17 20:20:54

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 217 (class 1259 OID 16439)
-- Name: camiones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.camiones (
    placa character varying(10) NOT NULL,
    capacidad integer NOT NULL,
    tipo_camion character varying(50) NOT NULL,
    habilitado boolean DEFAULT true,
    conductor_id integer,
    eliminado boolean DEFAULT false NOT NULL
);


ALTER TABLE public.camiones OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16508)
-- Name: cargues; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cargues (
    id integer NOT NULL,
    placa character varying(10) NOT NULL,
    documento character varying(20) NOT NULL,
    codigo_material integer NOT NULL,
    cantidad numeric(10,2) NOT NULL,
    fecha_inicio_programada timestamp without time zone NOT NULL,
    fecha_fin_programada timestamp without time zone NOT NULL,
    fecha_inicio_real timestamp without time zone,
    fecha_fin_real timestamp without time zone,
    estado character varying(50) NOT NULL,
    observaciones text,
    usuario_id integer NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    conductor_id integer NOT NULL
);


ALTER TABLE public.cargues OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16507)
-- Name: cargues_temp_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cargues_temp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cargues_temp_id_seq OWNER TO postgres;

--
-- TOC entry 4849 (class 0 OID 0)
-- Dependencies: 223
-- Name: cargues_temp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cargues_temp_id_seq OWNED BY public.cargues.id;


--
-- TOC entry 218 (class 1259 OID 16449)
-- Name: clientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clientes (
    documento character varying(20) NOT NULL,
    nombre character varying(100) NOT NULL,
    direccion character varying(200) NOT NULL,
    contacto character varying(50) NOT NULL,
    correo character varying(100) NOT NULL,
    eliminado boolean DEFAULT false NOT NULL
);


ALTER TABLE public.clientes OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16454)
-- Name: materiales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.materiales (
    nombre character varying(100) NOT NULL,
    unidad_medida character varying(50) NOT NULL,
    codigo integer NOT NULL,
    eliminado boolean DEFAULT false NOT NULL
);


ALTER TABLE public.materiales OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 49350)
-- Name: materiales_codigo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.materiales_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.materiales_codigo_seq OWNER TO postgres;

--
-- TOC entry 4850 (class 0 OID 0)
-- Dependencies: 226
-- Name: materiales_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.materiales_codigo_seq OWNED BY public.materiales.codigo;


--
-- TOC entry 220 (class 1259 OID 16459)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    codigo_rol character varying(20) NOT NULL,
    nombre character varying(50) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 32936)
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16465)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombre_usuario character varying(100) NOT NULL,
    contrasena character varying(100) NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    codigo_rol character varying(20) NOT NULL,
    cedula character varying(10),
    nombre character varying(100),
    telefono character varying(20),
    correo character varying(20),
    edad integer,
    eliminado boolean DEFAULT false NOT NULL
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16464)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;

--
-- TOC entry 4851 (class 0 OID 0)
-- Dependencies: 221
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- TOC entry 4675 (class 2604 OID 16511)
-- Name: cargues id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cargues ALTER COLUMN id SET DEFAULT nextval('public.cargues_temp_id_seq'::regclass);


--
-- TOC entry 4670 (class 2604 OID 49351)
-- Name: materiales codigo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materiales ALTER COLUMN codigo SET DEFAULT nextval('public.materiales_codigo_seq'::regclass);


--
-- TOC entry 4672 (class 2604 OID 16468)
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- TOC entry 4678 (class 2606 OID 16443)
-- Name: camiones camiones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camiones
    ADD CONSTRAINT camiones_pkey PRIMARY KEY (placa);


--
-- TOC entry 4688 (class 2606 OID 16516)
-- Name: cargues cargues_temp_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cargues
    ADD CONSTRAINT cargues_temp_pkey PRIMARY KEY (id);


--
-- TOC entry 4680 (class 2606 OID 16453)
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (documento);


--
-- TOC entry 4682 (class 2606 OID 49359)
-- Name: materiales materiales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materiales
    ADD CONSTRAINT materiales_pkey PRIMARY KEY (codigo);


--
-- TOC entry 4684 (class 2606 OID 16463)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (codigo_rol);


--
-- TOC entry 4691 (class 2606 OID 32942)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- TOC entry 4686 (class 2606 OID 16471)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4689 (class 1259 OID 32943)
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- TOC entry 4692 (class 2606 OID 41141)
-- Name: camiones camiones_temp_conductor_idKey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camiones
    ADD CONSTRAINT "camiones_temp_conductor_idKey" FOREIGN KEY (conductor_id) REFERENCES public.usuarios(id) NOT VALID;


--
-- TOC entry 4694 (class 2606 OID 49366)
-- Name: cargues cargues_temp_codigo_material_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cargues
    ADD CONSTRAINT cargues_temp_codigo_material_fkey FOREIGN KEY (codigo_material) REFERENCES public.materiales(codigo) NOT VALID;


--
-- TOC entry 4695 (class 2606 OID 41136)
-- Name: cargues cargues_temp_conductor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cargues
    ADD CONSTRAINT cargues_temp_conductor_fkey FOREIGN KEY (conductor_id) REFERENCES public.usuarios(id) NOT VALID;


--
-- TOC entry 4696 (class 2606 OID 16522)
-- Name: cargues cargues_temp_documento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cargues
    ADD CONSTRAINT cargues_temp_documento_fkey FOREIGN KEY (documento) REFERENCES public.clientes(documento);


--
-- TOC entry 4697 (class 2606 OID 16517)
-- Name: cargues cargues_temp_placa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cargues
    ADD CONSTRAINT cargues_temp_placa_fkey FOREIGN KEY (placa) REFERENCES public.camiones(placa);


--
-- TOC entry 4698 (class 2606 OID 16532)
-- Name: cargues cargues_temp_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cargues
    ADD CONSTRAINT cargues_temp_usuario_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- TOC entry 4693 (class 2606 OID 16472)
-- Name: usuarios usuarios_codigo_rol_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_codigo_rol_fkey FOREIGN KEY (codigo_rol) REFERENCES public.roles(codigo_rol);


-- Completed on 2025-05-17 20:20:54

--
-- PostgreSQL database dump complete
--

