SELECT
	 [Clientes].NroDocumento
	,[Clientes].NombreCliente
	,[Clientes].Direccion
	,[Localidades].NombreLocalidad
	,LEFT([Localidades].IdLocalidad,4) AS CodigoPostal
	,[Provincias].NombreProvincia
	,[Clientes].Telefono
	,[Clientes].Celular
	,[Clientes].Activo
	,(	SELECT TOP 1 [Ventas].[Fecha]
		FROM [Ventas]
		WHERE ([Ventas].[NroDocCliente] = [Clientes].NroDocumento)
		AND ([Ventas].[IdTipoComprobante] = 'COTIZACION' OR [Ventas].[IdTipoComprobante] = 'FACT')
	) AS UltimaVenta

FROM [Clientes]
LEFT JOIN [Localidades] ON ([Clientes].IdLocalidad = [Localidades].IdLocalidad)
LEFT JOIN [Provincias]  ON ([Localidades].IdProvincia = [Provincias].IdProvincia)